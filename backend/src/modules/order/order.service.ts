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
            include: { items: true, transactions: true, shippingMethod: true, timelines: { orderBy: { createdAt: 'desc' } } },
        });

        if (!order) throw new NotFoundException('Order not found');

        // Security check: If strict user check is required
        if (userId && order.userId && order.userId !== userId) {
            throw new NotFoundException('Order not found');
        }
        return order;
    }

    // ============================================
    // ADMIN API
    // ============================================

    async findAllPaginated(dto: { page?: number; limit?: number; search?: string; status?: string; sort?: string }) {
        try {
            const page = Number(dto.page || 1);
            const limit = Number(dto.limit || 20);
            const { search, status, sort } = dto;
            const skip = (page - 1) * limit;

            const where: Prisma.OrderWhereInput = {};

            if (status) {
                where.status = status as any;
            }

            if (search) {
                where.OR = [
                    { code: { contains: search, mode: 'insensitive' } },
                    { shippingAddress: { path: ['fullName'], string_contains: search } },
                ];
            }

            // Sorting
            let orderBy: any = { createdAt: 'desc' };
            if (sort) {
                const [field, direction] = sort.split(':');
                orderBy = { [field]: direction };
            }

            const [items, total] = await Promise.all([
                this.prisma.order.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy,
                    include: {
                        user: { select: { id: true, email: true, fullName: true } },
                        _count: { select: { items: true } }
                    }
                }),
                this.prisma.order.count({ where })
            ]);

            return {
                items,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            this.logger.error('Error fetching paginated orders:', error);
            throw error;
        }
    }

    async updateStatus(id: string, status: string, actorId?: string, note?: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!order) throw new NotFoundException('Order not found');

        return this.prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.order.update({
                where: { id },
                data: {
                    status: status as any,
                    // Auto-set timestamps based on status
                    ...(status === 'confirmed' ? { confirmedAt: new Date() } : {}),
                    ...(status === 'shipping' ? { shippedAt: new Date() } : {}),
                    ...(status === 'delivered' ? { deliveredAt: new Date() } : {}),
                    ...(status === 'completed' ? { completedAt: new Date() } : {}),
                    ...(status === 'cancelled' ? { cancelledAt: new Date() } : {}),
                }
            });

            await tx.orderTimeline.create({
                data: {
                    orderId: id,
                    action: `STATUS_UPDATE_${status.toUpperCase()}`,
                    fromStatus: order.status,
                    toStatus: status as any,
                    description: note || `Order status updated to ${status}`,
                    actorId,
                    actorType: actorId ? 'admin' : 'system'
                }
            });

            return updatedOrder;
        });
    }

    async updateTracking(id: string, trackingCode: string, estimatedDeliveryAt?: Date, actorId?: string) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.update({
                where: { id },
                data: {
                    trackingCode,
                    estimatedDeliveryAt: estimatedDeliveryAt || undefined,
                }
            });

            await tx.orderTimeline.create({
                data: {
                    orderId: id,
                    action: 'TRACKING_UPDATE',
                    description: `Updated tracking code: ${trackingCode}`,
                    actorId,
                    actorType: 'admin'
                }
            });

            return order;
        });
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
                            productVariantId: variant.id,
                            warehouseId: inv.warehouseId,
                            actionType: 'SALE',
                            quantityChange: -deduct,
                            beforeQuantity: inv.quantity,
                            afterQuantity: inv.quantity - deduct,
                            referenceType: 'ORDER',
                            referenceId: orderId,
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
