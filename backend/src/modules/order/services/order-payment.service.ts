import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderWithPaymentDto } from '../dto/create-order-with-payment.dto';
import {
    OrderPaymentResponseDto,
    OrderSummaryDto,
    PaymentDetailsDto,
} from '../dto/order-payment-response.dto';
import { PaymentFlowStatus } from '../enums/payment-flow-status.enum';
import { PaymentService } from '@modules/payment/payment.service';
import { Prisma, PaymentMethodEnum, OrderStatusEnum, PaymentStatusEnum } from '@prisma/client';
import { InventoryService } from '../../inventory/inventory.service';
import { InventoryAllocatorService } from '../../inventory/inventory-allocator.service';
import { randomBytes, createHash } from 'node:crypto';
import { OrderStatusValidator } from '../utils/order-status.validator';
import { CheckoutTokenService } from './checkout-token.service';

/**
 * OrderPaymentService
 * 
 * Core orchestrator for Order-Payment integration flow.
 */
@Injectable()
export class OrderPaymentService {
    private readonly logger = new Logger(OrderPaymentService.name);
    private readonly PAYMENT_TIMEOUT_MINUTES = 15;
    private readonly ORDER_CODE_PREFIX = 'ORD';
    private readonly SHIPPING_FEE = 30000; // VND

    constructor(
        private readonly prisma: PrismaService,
        private readonly paymentService: PaymentService,
        private readonly inventoryService: InventoryService,
        private readonly inventoryAllocator: InventoryAllocatorService,
        private readonly checkoutTokenService: CheckoutTokenService,
    ) { }

    /**
     * Step 1: Validate cart and reserve inventory (snapshot)
     */
    async validateCheckout(
        userId?: string,
        sessionId?: string,
    ): Promise<{ checkoutToken: string; snapshot: { items: any[]; totals: any }; expiresAt: Date }> {
        this.logger.log(`Validating checkout for userId=${userId}, sessionId=${sessionId}`);

        const { cart, variants } = await this.getCartAndVariants(userId, sessionId);

        if (!cart || cart.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        const allocations = await this.inventoryAllocator.allocate(
            cart.items.map((item) => ({
                variantId: item.productVariantId,
                quantity: item.quantity,
            }))
        );

        const { totals } = this.calculateOrderTotals(cart.items, variants);
        const expiresAt = new Date(Date.now() + this.PAYMENT_TIMEOUT_MINUTES * 60 * 1000);
        const cartHash = this.generateCartHash(cart.items);

        const checkoutToken = await this.checkoutTokenService.generateToken({
            cartHash,
            userId,
            sessionId,
        });

        return {
            checkoutToken,
            snapshot: {
                items: cart.items.map(item => ({
                    variantId: item.productVariantId,
                    quantity: item.quantity,
                    price: Number(variants.find(v => v.id === item.productVariantId)?.price || 0),
                })),
                totals,
            },
            expiresAt,
        };
    }

    /**
     * Step 2: Create order with payment integration
     */
    async createOrderWithPayment(
        dto: CreateOrderWithPaymentDto,
        userId?: string,
        sessionId?: string,
    ): Promise<OrderPaymentResponseDto> {
        this.logger.log(`Creating order: method=${dto.paymentMethod}, userId=${userId}`);

        // 1. Verify checkout token
        const tokenPayload = await this.checkoutTokenService.verifyToken(dto.checkoutToken);
        
        // Safety check: token ownership
        if (tokenPayload.userId !== userId || tokenPayload.sessionId !== sessionId) {
            throw new BadRequestException('Checkout token ownership mismatch');
        }

        // 2. Fetch cart and variants
        const { cart, variants } = await this.getCartAndVariants(userId, sessionId);

        if (!cart || cart.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        // 3. Verify cart state hasn't changed since token generation
        const currentCartHash = this.generateCartHash(cart.items);
        if (currentCartHash !== tokenPayload.cartHash) {
            throw new ConflictException('Cart content has changed. Please re-validate checkout.');
        }

        // 4. Allocate inventory
        const allocations = await this.inventoryAllocator.allocate(
            cart.items.map((item) => ({
                variantId: item.productVariantId,
                quantity: item.quantity,
            }))
        );

        const { orderItemsData, totals } = this.calculateOrderTotals(cart.items, variants, dto.shippingMethodId);
        const paymentDeadline = new Date(Date.now() + this.PAYMENT_TIMEOUT_MINUTES * 60 * 1000);

        try {
            const result = await this.prisma.$transaction(async (tx) => {
                // 4a. Create order
                const order = await this.createOrder(tx, {
                    userId,
                    sessionId: userId ? null : sessionId,
                    dto,
                    orderItemsData,
                    subTotal: totals.subtotal,
                    totalAmount: totals.total,
                    status: 'pending_payment',
                    paymentDeadline,
                });

                // 4b. Reserve inventory with ownership tracking
                await this.inventoryService.reserve(
                    order.id,
                    allocations,
                    paymentDeadline,
                    tx,
                    userId,
                    sessionId,
                );

                // 4c. Create payment transaction
                const payment = await this.createPaymentTransaction(tx, {
                    orderId: order.id,
                    amount: totals.total,
                    provider: dto.paymentMethod,
                    status: 'pending',
                });

                // 4d. Clear cart
                await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

                return { order, payment };
            });

            // Step 5: Generate payment URL
            let paymentUrl: string | null = null;
            if (dto.paymentMethod !== 'VIETQR') {
                try {
                    paymentUrl = await this.paymentService.generatePaymentUrl(
                        result.order.id,
                        result.order.code,
                        totals.total,
                        dto.paymentMethod,
                        dto.returnUrl,
                        dto.cancelUrl,
                    );
                } catch (error) {
                    await this.cancelOrderAndReleaseInventory(result.order.id, 'Payment initiation failed');
                    throw new BadRequestException('Failed to initiate payment');
                }
            }

            return this.buildOrderPaymentResponse(result.order, result.payment, paymentUrl, dto.paymentMethod === 'VIETQR');
        } catch (error) {
            this.logger.error('Failed to create order with payment', error);
            throw error;
        }
    }

    async confirmOrder(orderId: string): Promise<void> {
        this.logger.log(`Confirming order: ${orderId}`);

        await this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true },
            });

            if (!order || order.status === 'confirmed') return;

            OrderStatusValidator.validate(orderId, order.status, OrderStatusEnum.confirmed);

            await this.inventoryService.deduct(orderId, tx);

            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'confirmed',
                    paymentStatus: 'paid',
                    confirmedAt: new Date(),
                },
            });

            await tx.orderTimeline.create({
                data: {
                    orderId,
                    action: 'order_confirmed',
                    fromStatus: order.status,
                    toStatus: 'confirmed',
                    description: 'Order confirmed after successful payment',
                    actorType: 'system',
                },
            });
        });
    }

    async cancelOrder(orderId: string, reason: string): Promise<void> {
        await this.cancelOrderAndReleaseInventory(orderId, reason);
    }

    private async getCartAndVariants(userId?: string, sessionId?: string) {
        const cart = await this.prisma.cart.findFirst({
            where: userId ? { userId } : { sessionId },
            include: { items: true },
        });

        if (!cart || cart.items.length === 0) return { cart: null, variants: [] };

        const variantIds = cart.items.map((item) => item.productVariantId);
        const variants = await this.prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: {
                product: { select: { name: true } },
            },
        });

        return { cart, variants };
    }

    private calculateOrderTotals(items: any[], variants: any[], shippingMethodId?: string) {
        const orderItemsData = items.map((item) => {
            const variant = variants.find((v) => v.id === item.productVariantId);
            const price = Number(variant.price);
            return {
                productVariantId: variant.id,
                productName: typeof variant.product.name === 'string' 
                    ? variant.product.name 
                    : (variant.product.name.en || variant.product.name.vi || 'Product'),
                sku: variant.sku,
                variantTitle: variant.variantTitle || {},
                quantity: item.quantity,
                price,
                totalLine: price * item.quantity,
            };
        });

        const subtotal = orderItemsData.reduce((sum, item) => sum + item.totalLine, 0);
        const total = subtotal + this.SHIPPING_FEE;

        return { orderItemsData, totals: { subtotal, total, shipping: this.SHIPPING_FEE } };
    }

    private async createOrder(tx: Prisma.TransactionClient, params: any) {
        const orderCode = this.generateOrderCode();
        return tx.order.create({
            data: {
                code: orderCode,
                userId: params.userId,
                sessionId: params.sessionId,
                status: params.status,
                paymentStatus: 'unpaid',
                paymentMethod: params.dto.paymentMethod as PaymentMethodEnum,
                paymentDeadline: params.paymentDeadline,
                shippingAddress: params.dto.shippingAddress,
                billingAddress: params.dto.billingAddress || params.dto.shippingAddress,
                shippingMethodId: params.dto.shippingMethodId,
                currency: 'VND',
                subTotal: params.subTotal,
                shippingFee: this.SHIPPING_FEE,
                totalAmount: params.totalAmount,
                note: params.dto.note,
                items: { create: params.orderItemsData },
            },
            include: { items: true },
        });
    }

    private async createPaymentTransaction(tx: Prisma.TransactionClient, params: any) {
        return tx.paymentTransaction.create({
            data: {
                orderId: params.orderId,
                amount: params.amount,
                currency: 'VND',
                type: 'payment',
                status: params.status,
                provider: params.provider,
                transactionCode: this.generateTransactionCode(),
            },
        });
    }

    private async cancelOrderAndReleaseInventory(orderId: string, reason?: string) {
        await this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({ where: { id: orderId } });
            if (!order || order.status === 'cancelled') return;

            await this.inventoryService.release(orderId, tx);
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'cancelled',
                    cancelReason: reason || 'Payment failed',
                    cancelledAt: new Date(),
                },
            });
            await tx.paymentTransaction.updateMany({
                where: { orderId },
                data: { status: 'failed' },
            });
        });
    }

    private generateCartHash(items: any[]): string {
        const sortedItems = [...items].sort((a, b) => a.productVariantId.localeCompare(b.productVariantId));
        const content = sortedItems.map(i => `${i.productVariantId}:${i.quantity}`).join('|');
        return createHash('sha256').update(content).digest('hex');
    }

    private buildOrderPaymentResponse(order: any, payment: any, paymentUrl: string | null, isVietQR: boolean): OrderPaymentResponseDto {
        return {
            order: {
                id: order.id,
                code: order.code,
                status: order.status,
                paymentStatus: order.paymentStatus,
                paymentDeadline: order.paymentDeadline,
                totalAmount: Number(order.totalAmount),
                currency: order.currency,
                createdAt: order.createdAt,
            },
            payment: {
                id: payment.id,
                paymentUrl,
                transactionCode: payment.transactionCode,
                provider: payment.provider,
                status: payment.status,
            },
            flowStatus: PaymentFlowStatus.PENDING_PAYMENT,
            message: 'Order created. Please complete payment.',
        };
    }

    private generateOrderCode() { return `${this.ORDER_CODE_PREFIX}-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`; }
    private generateTransactionCode() { return `TXN-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`; }
}
