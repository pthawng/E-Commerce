import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client'; // Import Prisma namespace
import { PrismaService } from 'src/prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
    constructor(private readonly prisma: PrismaService) { }

    // ============================================
    // HELPER: FIND CART (User or Guest)
    // ============================================
    private async findCartOrThrow(userId?: string, sessionId?: string) {
        if (!userId && !sessionId) {
            throw new BadRequestException('UserId or SessionId required');
        }

        const whereInput: Prisma.CartWhereInput = userId
            ? { userId }
            : { sessionId };

        const cart = await this.prisma.cart.findFirst({
            where: whereInput,
            include: {
                items: {
                    orderBy: { addedAt: 'desc' },
                    include: {
                        // Display product info
                        // Note: Relation must match schema.prisma (missing in original schema, need manual query or relation if defined)
                        // In provided schema: CartItem -> ProductVariant (no relation name, but has productVariantId)
                        // To get info, we need to connect relation in Schema (will update later if missing), 
                        // Temporarily query raw or assume 'productVariant' relation exists (Prisma often auto-generates if FK exists)
                    }
                },
            },
        });

        return cart;
    }

    // Helper to get Cart with Items & Variant Info
    // Since Schema hasn't clearly defined reverse relation from CartItem -> Variant? 
    // Schema: model CartItem { productVariantId String ... }
    // Need manual query or update schema. Temporarily writing assumption code that 'variant' relation exists.
    // If Prisma hasn't generated relation, we need to update schema later.
    // CHECK: Schema has: InventoryItem relation productVariant.
    // Schema CartItem DOES NOT HAVE relation to ProductVariant? 
    // RE-CHECK SCHEMA: 
    // model CartItem { productVariantId String ... @@unique ... } -> NO relation field.
    // ACTION: Need to update schema to link CartItem -> ProductVariant to get price/name/image.
    // HOWEVER: I wll query variant separately in Add step to validate, 
    // But Get Cart will return raw first or fix schema.
    // UPDATE: User wants "Price Validation" -> Must join logic.

    // ============================================
    // 1. GET CART
    // ============================================
    async getCart(userId?: string, sessionId?: string) {
        const cart = await this.findCartOrThrow(userId, sessionId);
        if (!cart) return { items: [], total: 0 };

        // Manual load variants IF schema missing relation, else verify via relation
        // For safety, I will load items and map variant info manually if needed.
        // Get list of variant IDs
        const variantIds = cart.items.map(i => i.productVariantId);
        const variants = await this.prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: { product: { select: { slug: true, name: true } } }
        });

        // Map data
        const itemsWithDetail = cart.items.map(item => {
            const v = variants.find(v => v.id === item.productVariantId);
            return {
                ...item,
                variant: v ? {
                    sku: v.sku,
                    price: v.price, // Current price
                    snapshotPrice: item.cachedPrice, // Price at purchase time
                    title: v.variantTitle,
                    slug: v.product.slug,
                    name: v.product.name,
                    thumbnail: v.thumbnailUrl
                } : null
            };
        });

        return {
            id: cart.id,
            items: itemsWithDetail,
            // Calculate total based on SNAPSHOT price
            total: itemsWithDetail.reduce((sum, i) => sum + (Number(i.cachedPrice) * i.quantity), 0)
        };
    }

    // ============================================
    // 2. ADD TO CART
    // ============================================
    async addToCart(userId: string | undefined, sessionId: string | undefined, dto: AddToCartDto) {
        if (!userId && !sessionId) throw new BadRequestException('Missing User/Session info');

        // 1. Validate Product & Stock
        const variant = await this.prisma.productVariant.findUnique({
            where: { id: dto.variantId },
            include: {
                product: { select: { isActive: true } },
                inventoryItems: true
            },
        });

        if (!variant) throw new NotFoundException('Product not found');
        if (!variant.isActive || !variant.product.isActive) {
            throw new BadRequestException('Product is inactive');
        }

        // Check total stock (sum of warehouses, or default warehouse)
        // Assume online sales use total stock
        const totalStock = variant.inventoryItems.reduce((acc, inv) => acc + inv.quantity - inv.reservedQuantity, 0);
        if (totalStock < dto.quantity) {
            throw new BadRequestException(`Only ${totalStock} items left in stock`);
        }

        // 2. Find or Create Cart
        let cart = await this.this_findCartRaw(userId, sessionId);

        if (!cart) {
            cart = await this.prisma.cart.create({
                data: {
                    userId,
                    sessionId: userId ? undefined : sessionId, // If user exists, don't save session
                }
            });
        }

        // 3. Upsert Cart Item
        const existingItem = await this.prisma.cartItem.findUnique({
            where: {
                cartId_productVariantId: {
                    cartId: cart.id,
                    productVariantId: dto.variantId
                }
            }
        });

        if (existingItem) {
            // Check new quantity
            const newQty = existingItem.quantity + dto.quantity;
            if (newQty > 99) throw new BadRequestException('Quantity too large (max 99)');
            if (newQty > totalStock) throw new BadRequestException(`Insufficient stock (Remaining: ${totalStock})`);

            await this.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: newQty } // Keep old cachedPrice? Or update?
                // User logic: "Price Snapshot at add time".
                // If adding more, usually update to latest price for WHOLE item, or keep old?
                // Best UX: Update to latest price for the bunch (treat as new purchase).
                // data: { quantity: newQty, cachedPrice: variant.price }
            });
        } else {
            await this.prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productVariantId: dto.variantId,
                    quantity: dto.quantity,
                    cachedPrice: variant.price // SNAPSHOT PRICE HERE
                }
            });
        }

        return this.getCart(userId, sessionId);
    }

    // ============================================
    // 3. UPDATE ITEM
    // ============================================
    async updateItem(userId: string | undefined, sessionId: string | undefined, variantId: string, dto: UpdateCartItemDto) {
        if (dto.quantity === 0) return this.removeItem(userId, sessionId, variantId);

        const cart = await this.this_findCartRaw(userId, sessionId);
        if (!cart) throw new NotFoundException('Cart is empty');

        // Check stock again
        const variant = await this.prisma.productVariant.findUnique({
            where: { id: variantId },
            include: { inventoryItems: true }
        });
        if (!variant) throw new NotFoundException('Variant not found');

        const totalStock = variant.inventoryItems.reduce((acc, inv) => acc + inv.quantity - inv.reservedQuantity, 0);
        if (totalStock < dto.quantity) throw new BadRequestException(`Insufficient stock (Remaining: ${totalStock})`);

        await this.prisma.cartItem.update({
            where: {
                cartId_productVariantId: {
                    cartId: cart.id,
                    productVariantId: variantId
                }
            },
            data: { quantity: dto.quantity } // Update qty does NOT change price typically
        });

        return this.getCart(userId, sessionId);
    }

    // ============================================
    // 4. REMOVE ITEM
    // ============================================
    async removeItem(userId: string | undefined, sessionId: string | undefined, variantId: string) {
        const cart = await this.this_findCartRaw(userId, sessionId);
        if (!cart) return;

        await this.prisma.cartItem.deleteMany({ // deleteMany for safety if not found
            where: {
                cartId: cart.id,
                productVariantId: variantId
            }
        });

        return this.getCart(userId, sessionId);
    }

    // ============================================
    // 5. MERGE CART
    // ============================================
    async mergeCart(userId: string, sessionId: string) {
        // 1. Get Guest Cart
        const guestCart = await this.this_findCartRaw(undefined, sessionId);
        if (!guestCart) return this.getCart(userId, undefined); // Nothing to merge

        // 2. Get User Cart (or create)
        let userCart = await this.this_findCartRaw(userId, undefined);
        if (!userCart) {
            userCart = await this.prisma.cart.create({ data: { userId } });
        }

        // 3. Get Guest Items
        const guestItems = await this.prisma.cartItem.findMany({ where: { cartId: guestCart.id } });

        // 4. Merge Logic
        for (const item of guestItems) {
            const userItem = await this.prisma.cartItem.findUnique({
                where: {
                    cartId_productVariantId: { cartId: userCart.id, productVariantId: item.productVariantId }
                }
            });

            if (userItem) {
                // Accumulate logic
                await this.prisma.cartItem.update({
                    where: { id: userItem.id },
                    data: { quantity: userItem.quantity + item.quantity }
                });
            } else {
                // Move over
                await this.prisma.cartItem.create({
                    data: {
                        cartId: userCart.id,
                        productVariantId: item.productVariantId,
                        quantity: item.quantity,
                        cachedPrice: item.cachedPrice
                    }
                });
            }
        }

        // 5. Delete Guest Cart
        await this.prisma.cart.delete({ where: { id: guestCart.id } });

        return this.getCart(userId, undefined);
    }

    // ============================================
    // 6. REFRESH PRICES
    // ============================================
    async refreshCartPrices(userId?: string, sessionId?: string) {
        const cart = await this.getCart(userId, sessionId);
        // Note: getCart returns populated object, not raw DB entity. Recode raw find to iterate.

        const rawCart = await this.this_findCartRaw(userId, sessionId);
        if (!rawCart) return;

        const items = await this.prisma.cartItem.findMany({ where: { cartId: rawCart.id } });

        for (const item of items) {
            const variant = await this.prisma.productVariant.findUnique({ where: { id: item.productVariantId } });
            if (variant && Number(variant.price) !== Number(item.cachedPrice)) {
                await this.prisma.cartItem.update({
                    where: { id: item.id },
                    data: { cachedPrice: variant.price }
                });
            }
        }
        return this.getCart(userId, sessionId);
    }

    // --- RAW HELPER --- 
    private async this_findCartRaw(userId?: string, sessionId?: string) {
        if (userId) {
            return this.prisma.cart.findFirst({ where: { userId } });
        }
        if (sessionId) {
            return this.prisma.cart.findFirst({ where: { sessionId } });
        }
        return null;
    }
}
