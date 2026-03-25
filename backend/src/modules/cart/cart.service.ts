import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
    private readonly logger = new Logger(CartService.name);
    constructor(private readonly prisma: PrismaService) { }

    // Helper to extract string from Json localized name
    private getLocalizedName(name: any): string {
        if (!name) return '';
        if (typeof name === 'string') return name;
        // Assume names are stored as { vi: "...", en: "..." }
        return name.vi || name.en || Object.values(name)[0] || 'Unnamed Product';
    }

    // ============================================
    // 1. GET CART
    // ============================================
    async getCart(userId?: string, sessionId?: string) {
        try {
            const cart = await this.findCartRaw(userId, sessionId);
            if (!cart) return this.emptyCartResponse();

            // 1. Get raw items
            const items = await this.prisma.cartItem.findMany({
                where: { cartId: cart.id },
                orderBy: { addedAt: 'desc' }
            });

            if (items.length === 0) return this.emptyCartResponse();

            // 2. Fetch all variants in one go (bypassing potentially broken relations)
            const variantIds = items.map(i => i.productVariantId);
            const variants = await this.prisma.productVariant.findMany({
                where: { id: { in: variantIds } },
                include: {
                    product: { select: { name: true, slug: true, isActive: true } },
                    inventoryItems: { select: { quantity: true, reservedQuantity: true } },
                    media: { where: { isThumbnail: true }, take: 1 },
                    attributes: {
                        include: {
                            attributeValue: {
                                include: {
                                    attribute: true
                                }
                            }
                        }
                    }
                }
            });

            // 3. Map items and calculate totals
            let subtotal = 0;
            const mappedItems: any[] = [];
            for (const item of items) {
                const v = variants.find(v => v.id === item.productVariantId);
                if (!v) continue;

                // Robust Decimal handling: toString() then Number()
                const currentPrice = v.price ? Number(v.price.toString()) : 0;
                const lineTotal = currentPrice * item.quantity;
                subtotal += lineTotal;

                const totalStock = v.inventoryItems.reduce((acc, inv) => acc + inv.quantity - inv.reservedQuantity, 0);

                mappedItems.push({
                    id: item.id,
                    variantId: v.id,
                    productId: v.productId,
                    name: v.product?.name ?? { en: 'Unknown Product' },
                    slug: v.product?.slug ?? '',
                    price: currentPrice,
                    quantity: item.quantity,
                    image: v.thumbnailUrl || v.media?.[0]?.url || '',
                    stock: totalStock,
                    isAvailable: (v.isActive && v.product?.isActive && totalStock > 0) ?? false,
                    attributes: (v.attributes || [])
                        .filter(va => va?.attributeValue?.attribute)
                        .map(va => ({
                            name: this.getLocalizedName(va.attributeValue.attribute.name),
                            value: this.getLocalizedName(va.attributeValue.value)
                        }))
                });
            }

            // 4. Calculate Global Totals
            const SHIPPING_THRESHOLD = 2000000;
            const SHIPPING_FEE = 35000;
            const isFreeShipping = subtotal >= SHIPPING_THRESHOLD;
            const shipping = subtotal === 0 ? 0 : (isFreeShipping ? 0 : SHIPPING_FEE);
            const tax = 0;
            const total = subtotal + shipping + tax;

            return {
                id: cart.id,
                version: (cart as any).version,
                items: mappedItems,
                totals: {
                    subtotal,
                    shipping,
                    tax,
                    total,
                    isFreeShipping,
                    shippingThreshold: SHIPPING_THRESHOLD,
                }
            };
        } catch (error) {
            this.logger.error(`getCart failed for userId=${userId}, sessionId=${sessionId}`, error?.stack || error);
            throw error;
        }
    }

    private emptyCartResponse() {
        return {
            items: [],
            version: 1,
            totals: {
                subtotal: 0,
                shipping: 0,
                tax: 0,
                total: 0,
                isFreeShipping: false,
                shippingThreshold: 10000,
            }
        };
    }

    // ============================================
    // 2. ADD TO CART
    // ============================================
    async addToCart(userId: string | undefined, sessionId: string | undefined, dto: AddToCartDto) {
        try {
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
            if (!variant.isActive || !variant.product?.isActive) {
                throw new BadRequestException('Product is currently unavailable');
            }

            const availableStock = variant.inventoryItems.reduce((acc, inv) => acc + inv.quantity - inv.reservedQuantity, 0);
            if (availableStock <= 0) throw new BadRequestException('Product is out of stock');

            // 2. Find or Create Cart
            let cart = await this.findCartRaw(userId, sessionId);

            if (!cart) {
                cart = await this.prisma.cart.create({
                    data: {
                        userId,
                        sessionId: userId ? undefined : sessionId,
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

            await this.prisma.$transaction(async (tx) => {
                if (existingItem) {
                    const requestedQty = existingItem.quantity + dto.quantity;
                    const finalQty = Math.min(requestedQty, availableStock, 99);

                    await tx.cartItem.update({
                        where: { id: existingItem.id },
                        data: { quantity: finalQty, cachedPrice: variant.price }
                    });
                } else {
                    const finalQty = Math.min(dto.quantity, availableStock, 99);
                    await tx.cartItem.create({
                        data: {
                            cartId: cart.id,
                            productVariantId: dto.variantId,
                            quantity: finalQty,
                            cachedPrice: variant.price
                        }
                    });
                }

                // Update updatedAt
                await tx.cart.update({
                    where: { id: cart.id },
                    data: { updatedAt: new Date() }
                });
            });

            return this.getCart(userId, sessionId);
        } catch (error) {
            this.logger.error(`addToCart failed for userId=${userId}, sessionId=${sessionId}`, error?.stack || error);
            throw error;
        }
    }

    // ============================================
    // 3. UPDATE ITEM
    // ============================================
    async updateItem(userId: string | undefined, sessionId: string | undefined, variantId: string, dto: UpdateCartItemDto) {
        try {
            if (dto.quantity <= 0) return this.removeItem(userId, sessionId, variantId, dto.version);

            const cart = await this.findCartRaw(userId, sessionId);
            if (!cart) throw new NotFoundException('Cart not found');

            const variant = await this.prisma.productVariant.findUnique({
                where: { id: variantId },
                include: { inventoryItems: true }
            });
            if (!variant) throw new NotFoundException('Variant not found');

            const availableStock = variant.inventoryItems.reduce((acc, inv) => acc + inv.quantity - inv.reservedQuantity, 0);
            const finalQty = Math.min(dto.quantity, availableStock, 99);

            await this.prisma.$transaction(async (tx) => {
                // Use updateMany to avoid P2025 error if record was concurrently deleted
                await tx.cartItem.updateMany({
                    where: {
                        cartId: cart.id,
                        productVariantId: variantId
                    },
                    data: { quantity: finalQty }
                });

                // Update updatedAt
                await tx.cart.update({
                    where: { id: cart.id },
                    data: { updatedAt: new Date() }
                });
            });

            return this.getCart(userId, sessionId);
        } catch (error) {
            this.logger.error(`updateItem failed for userId=${userId}, sessionId=${sessionId}`, error?.stack || error);
            throw error;
        }
    }

    // ============================================
    // 4. REMOVE ITEM
    // ============================================
    async removeItem(userId: string | undefined, sessionId: string | undefined, variantId: string, version?: number) {
        try {
            const cart = await this.findCartRaw(userId, sessionId);
            if (!cart) return this.emptyCartResponse();

            await this.prisma.$transaction(async (tx) => {
                await tx.cartItem.deleteMany({
                    where: {
                        cartId: cart.id,
                        productVariantId: variantId
                    }
                });

                // Update updatedAt
                await tx.cart.update({
                    where: { id: cart.id },
                    data: { updatedAt: new Date() }
                });
            });

            return this.getCart(userId, sessionId);
        } catch (error) {
            this.logger.error(`removeItem failed for userId=${userId}, sessionId=${sessionId}`, error?.stack || error);
            throw error;
        }
    }

    // ============================================
    // 5. MERGE CART (With Stock Guard)
    // ============================================
    async mergeCart(userId: string, sessionId: string) {
        try {
            const guestCart = await this.findCartRaw(undefined, sessionId);
            if (!guestCart) return this.getCart(userId, undefined);

            let userCart = await this.findCartRaw(userId, undefined);
            if (!userCart) {
                userCart = await this.prisma.cart.create({ data: { userId } });
            }

            const guestItems = await this.prisma.cartItem.findMany({
                where: { cartId: guestCart.id },
                include: {
                    productVariant: {
                        include: { inventoryItems: true }
                    }
                } as any
            }) as any[];

            for (const gItem of guestItems) {
                if (!gItem.productVariant) continue;

                const availableStock = (gItem.productVariant.inventoryItems || []).reduce(
                    (acc: any, inv: any) => acc + (inv.quantity || 0) - (inv.reservedQuantity || 0), 0
                );

                const userItem = await this.prisma.cartItem.findUnique({
                    where: {
                        cartId_productVariantId: { cartId: userCart.id, productVariantId: gItem.productVariantId }
                    }
                });

                if (userItem) {
                    const mergedQty = Math.min(userItem.quantity + gItem.quantity, availableStock, 99);
                    await this.prisma.cartItem.update({
                        where: { id: userItem.id },
                        data: { quantity: mergedQty }
                    });
                } else {
                    const finalQty = Math.min(gItem.quantity, availableStock, 99);
                    await this.prisma.cartItem.create({
                        data: {
                            cartId: userCart.id,
                            productVariantId: gItem.productVariantId,
                            quantity: finalQty,
                            cachedPrice: gItem.cachedPrice
                        }
                    });
                }
            }

            // Clean up guest cart items then cart
            await this.prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
            await this.prisma.cart.delete({ where: { id: guestCart.id } });

            return this.getCart(userId, undefined);
        } catch (error) {
            this.logger.error(`mergeCart failed for userId=${userId}, sessionId=${sessionId}`, error?.stack || error);
            throw error;
        }
    }

    // ============================================
    // 6. REFRESH PRICES
    // ============================================
    async refreshCartPrices(userId?: string, sessionId?: string) {
        const cart = await this.getCart(userId, sessionId);
        // Note: getCart returns populated object, not raw DB entity. Recode raw find to iterate.

        const rawCart = await this.findCartRaw(userId, sessionId);
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
    private async findCartRaw(userId?: string, sessionId?: string) {
        if (userId) {
            return this.prisma.cart.findFirst({
                where: { userId },
                orderBy: { updatedAt: 'desc' }
            });
        }
        if (sessionId) {
            return this.prisma.cart.findFirst({
                where: { sessionId },
                orderBy: { updatedAt: 'desc' }
            });
        }
        return null;
    }
}
