import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);
    private readonly SHIPPING_FEE = 30000;
    private readonly ORDER_CODE_PREFIX = 'ORD';

    constructor(
        private readonly prisma: PrismaService,
    ) { }

    // ============================================
    // PUBLIC API
    // ============================================

    /**
     * Main checkpoint for creating an order.
     * Orchestrates validation, pricing, and transaction execution.
     */
    async createOrder(userId: string | undefined, sessionId: string | undefined, dto: CreateOrderDto) {
        if (!userId && !sessionId) throw new BadRequestException('User or Session required');

        // 1. Fetch Cart & Variants
        const { cart, variants } = await this.getCartAndVariants(userId, sessionId);

        // 2. Validations (Stock & Price)
        const priceMismatches = this.validateCartItems(cart.items, variants);

        if (priceMismatches.length > 0 && !dto.confirmPriceChange) {
            throw new ConflictException({
                message: 'Product prices have changed. Please review your cart.',
                code: 'PRICE_CHANGED',
                details: priceMismatches,
            });
        }

        // 3. Execute Transaction
        return this.prisma.$transaction(async (tx) => {
            // Calculate final items and totals
            const { orderItemsData, subTotal } = this.calculateOrderTotals(cart.items, variants);
            const totalAmount = subTotal + this.SHIPPING_FEE;

            // Create Order Record
            const order = await tx.order.create({
                data: {
                    code: this.generateOrderCode(),
                    userId: userId || null,
                    status: 'pending',
                    paymentStatus: 'unpaid',
                    shippingAddress: dto.shippingAddress as unknown as Prisma.InputJsonValue,
                    billingAddress: (dto.billingAddress ?? dto.shippingAddress) as unknown as Prisma.InputJsonValue,
                    subTotal,
                    shippingFee: this.SHIPPING_FEE,
                    totalAmount,
                    items: { create: orderItemsData },
                    transactions: {
                        create: {
                            amount: totalAmount,
                            type: 'payment',
                            status: 'pending',
                            provider: dto.paymentMethod,
                            method: dto.paymentMethod,
                        },
                    },
                },
            });

            // Deduct Inventory
            await this.processInventoryDeduction(tx, cart.items, variants, order.id, order.code);

            // Cleanup Cart
            await tx.cart.delete({ where: { id: cart.id } });

            return order;
        });
    }

    async getMyOrders(userId: string) {
        return this.prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { items: true },
        });
    }

    async getOrder(id: string, userId?: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { items: true, transactions: true, shippingMethod: true },
        });

        if (!order) throw new NotFoundException('Order not found');

        // Security check: If strict user check is required
        if (userId && order.userId && order.userId !== userId) {
            throw new NotFoundException('Order not found');
        }
        return order;
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================

    private async getCartAndVariants(userId?: string, sessionId?: string) {
        const cart = await this.prisma.cart.findFirst({
            where: userId ? { userId } : { sessionId },
            include: { items: true },
        });

        if (!cart || cart.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        const variantIds = cart.items.map((i) => i.productVariantId);
        const variants = await this.prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: { inventoryItems: true, product: true },
        });

        return { cart, variants };
    }

    private validateCartItems(
        cartItems: any[],
        variants: any[]
    ) {
        const priceMismatches: any[] = [];

        for (const item of cartItems) {
            const variant = variants.find((v) => v.id === item.productVariantId);

            if (!variant) throw new BadRequestException(`Product variant ${item.productVariantId} no longer exists`);
            if (!variant.isActive || !variant.product.isActive) {
                throw new BadRequestException(`Product ${variant.sku} is inactive`);
            }

            // Check Stock
            const totalStock = variant.inventoryItems.reduce(
                (acc, inv) => acc + inv.quantity - inv.reservedQuantity,
                0
            );
            if (totalStock < item.quantity) {
                throw new BadRequestException(`Insufficient stock for ${variant.sku}. Available: ${totalStock}`);
            }

            // Check Price Mismatch
            if (Number(variant.price) !== Number(item.cachedPrice)) {
                priceMismatches.push({
                    variantId: variant.id,
                    sku: variant.sku,
                    oldPrice: item.cachedPrice,
                    newPrice: variant.price,
                });
            }
        }

        return priceMismatches;
    }

    private calculateOrderTotals(cartItems: any[], variants: any[]) {
        let subTotal = 0;
        const orderItemsData = cartItems.map((item) => {
            const variant = variants.find((v) => v.id === item.productVariantId)!;
            const priceToUse = variant.price; // Source of truth
            const lineTotal = Number(priceToUse) * item.quantity;

            subTotal += lineTotal;

            return {
                productVariantId: variant.id,
                productName: (variant.product.name as any)?.vi ?? (variant.product.name as any)?.en ?? 'Product',
                sku: variant.sku,
                variantTitle: variant.variantTitle ?? {},
                thumbnailUrl: variant.thumbnailUrl,
                quantity: item.quantity,
                price: priceToUse,
                totalLine: lineTotal,
            };
        });

        return { orderItemsData, subTotal };
    }

    private async processInventoryDeduction(
        tx: Prisma.TransactionClient,
        cartItems: any[],
        variants: any[],
        orderId: string,
        orderCode: string
    ) {
        for (const item of cartItems) {
            const variant = variants.find((v) => v.id === item.productVariantId)!;
            let remainingToDeduct = item.quantity;

            // Simple warehouse selection: take from first available
            for (const inv of variant.inventoryItems) {
                if (remainingToDeduct <= 0) break;

                const available = inv.quantity - inv.reservedQuantity;
                if (available > 0) {
                    const deduct = Math.min(available, remainingToDeduct);

                    await tx.inventoryItem.update({
                        where: { id: inv.id },
                        data: { quantity: { decrement: deduct } },
                    });

                    await tx.inventoryLog.create({
                        data: {
                            inventoryItemId: inv.id,
                            actionType: 'SALE',
                            quantityChange: -deduct,
                            stockAfter: inv.quantity - deduct,
                            referenceId: orderId,
                            referenceCode: orderCode,
                            note: 'Order Checkout',
                        },
                    });

                    remainingToDeduct -= deduct;
                }
            }

            if (remainingToDeduct > 0) {
                throw new BadRequestException(`Inventory sync failed: Insufficient stock for ${variant.sku} during checkout`);
            }
        }
    }

    private generateOrderCode() {
        const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${this.ORDER_CODE_PREFIX}-${date}-${random}`;
    }
}
