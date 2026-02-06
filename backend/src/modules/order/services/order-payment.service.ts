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
import { Prisma } from 'src/generated/prisma/client';

/**
 * OrderPaymentService
 * 
 * Core orchestrator for Order-Payment integration flow.
 * Handles:
 * - Order creation with payment
 * - Inventory reservation
 * - Payment initiation
 * - Order confirmation/cancellation
 * 
 * Design: UseCase/Orchestrator pattern with compensating transactions
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
    ) { }

    /**
     * Main entry point: Create order with payment integration
     * 
     * Flow:
     * 1. Validate cart
     * 2. Reserve inventory (soft lock)
     * 3. Create order (pending_payment or confirmed)
     * 4. Create payment transaction
     * 5. For online payment: generate payment URL
     * 6. For COD: auto-confirm order
     * 
     * @throws BadRequestException - Empty cart, invalid data
     * @throws ConflictException - Insufficient stock
     */
    async createOrderWithPayment(
        dto: CreateOrderWithPaymentDto,
        userId?: string,
        sessionId?: string,
    ): Promise<OrderPaymentResponseDto> {
        // Validate user context
        if (!userId && !sessionId) {
            throw new BadRequestException('User or session required');
        }

        if (!userId && !dto.guestEmail) {
            throw new BadRequestException('Guest email is required for guest checkout');
        }

        this.logger.log(
            `Creating order with payment: method=${dto.paymentMethod}, userId=${userId}, sessionId=${sessionId}`,
        );

        // Step 1: Fetch and validate cart
        const { cart, variants } = await this.getCartAndVariants(userId, sessionId);

        if (!cart || cart.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        // Step 2: Validate stock availability
        this.validateStockAvailability(cart.items, variants);

        // Step 3: Calculate totals
        const { orderItemsData, subTotal, totalAmount } = this.calculateOrderTotals(
            cart.items,
            variants,
            dto.shippingMethodId,
        );

        // Step 4: Execute order creation in transaction
        const isCOD = dto.paymentMethod === 'COD';
        const orderStatus = isCOD ? 'confirmed' : 'pending_payment';
        const paymentDeadline = isCOD
            ? null
            : new Date(Date.now() + this.PAYMENT_TIMEOUT_MINUTES * 60 * 1000);

        try {
            const result = await this.prisma.$transaction(async (tx) => {
                // 4a. Reserve inventory (for online payment only)
                let reservationId: string | null = null;
                if (!isCOD) {
                    reservationId = await this.reserveInventory(
                        tx,
                        cart.items,
                        variants,
                        paymentDeadline!,
                    );
                }

                // 4b. Create order
                const order = await this.createOrder(tx, {
                    userId,
                    sessionId: userId ? null : sessionId as any,
                    dto,
                    orderItemsData,
                    subTotal,
                    totalAmount,
                    status: orderStatus as any,
                    paymentDeadline,
                    reservationId,
                });

                // 4c. Create payment transaction
                const payment = await this.createPaymentTransaction(tx, {
                    orderId: order.id,
                    amount: totalAmount,
                    provider: dto.paymentMethod,
                    status: isCOD ? 'success' : 'pending',
                });

                // 4d. For COD: deduct inventory immediately
                if (isCOD) {
                    await this.deductInventory(tx, cart.items, variants, order.id);
                }

                // 4e. Clear cart
                await tx.cartItem.deleteMany({
                    where: { cartId: cart.id },
                });

                return { order, payment, reservationId };
            });

            // Step 5: Generate payment URL (outside transaction)
            let paymentUrl: string | null = null;
            if (!isCOD) {
                try {
                    paymentUrl = await this.paymentService.generatePaymentUrl(
                        result.order.id,
                        result.order.code,
                        totalAmount,
                        dto.paymentMethod,
                        dto.returnUrl,
                        dto.cancelUrl,
                    );
                } catch (error) {
                    // Compensating transaction: cancel order if payment URL generation fails
                    this.logger.error(
                        `Failed to generate payment URL for order ${result.order.code}`,
                        error,
                    );
                    await this.cancelOrderAndReleaseInventory(result.order.id);
                    throw new BadRequestException('Failed to initiate payment');
                }
            }

            // Step 6: Build response
            return this.buildOrderPaymentResponse(
                result.order,
                result.payment,
                paymentUrl,
                isCOD,
            );
        } catch (error) {
            this.logger.error('Failed to create order with payment', error);
            throw error;
        }
    }

    /**
     * Confirm order after successful payment
     * Called by payment callback handler
     * 
     * Idempotent: Can be called multiple times safely
     */
    async confirmOrder(orderId: string): Promise<void> {
        this.logger.log(`Confirming order: ${orderId}`);

        await this.prisma.$transaction(async (tx) => {
            // Fetch order with items
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true },
            });

            if (!order) {
                throw new NotFoundException(`Order ${orderId} not found`);
            }

            // Idempotency: Skip if already confirmed
            if (order.status === 'confirmed') {
                this.logger.log(`Order ${orderId} already confirmed, skipping`);
                return;
            }

            if (order.status !== 'pending_payment') {
                throw new BadRequestException(
                    `Cannot confirm order in status: ${order.status}`,
                );
            }

            // Fetch variants for inventory deduction
            const variantIds = order.items.map((item) => item.productVariantId).filter((id): id is string => id !== null);
            const variants = await tx.productVariant.findMany({
                where: { id: { in: variantIds } },
                include: { inventoryItems: true },
            });

            // Deduct inventory
            await this.deductInventoryFromOrder(tx, order.items, variants, orderId);

            // Update reservation status
            if (order.reservationId) {
                await tx.inventoryReservation.updateMany({
                    where: { orderId },
                    data: { status: 'confirmed' },
                });
            }

            // Update order status
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'confirmed',
                    paymentStatus: 'paid',
                    confirmedAt: new Date(),
                },
            });

            // Create timeline entry
            await tx.orderTimeline.create({
                data: {
                    orderId,
                    action: 'order_confirmed',
                    fromStatus: 'pending_payment',
                    toStatus: 'confirmed',
                    description: 'Order confirmed after successful payment',
                    actorType: 'system',
                },
            });
        });

        this.logger.log(`Order ${orderId} confirmed successfully`);
    }

    /**
     * Cancel order after payment failure
     * Called by payment callback handler
     * 
     * Idempotent: Can be called multiple times safely
     */
    async cancelOrder(orderId: string, reason: string): Promise<void> {
        this.logger.log(`Cancelling order: ${orderId}, reason: ${reason}`);

        await this.cancelOrderAndReleaseInventory(orderId, reason);
    }

    /**
     * Cancel pending order (user-initiated)
     * 
     * Rules:
     * - Only pending_payment orders can be cancelled
     * - Guest orders require sessionId verification
     */
    async cancelPendingOrder(
        orderId: string,
        sessionId?: string,
        reason?: string,
    ): Promise<void> {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException(`Order ${orderId} not found`);
        }

        // Verify session ownership for guest orders
        if (!order.userId && order.sessionId !== sessionId) {
            throw new BadRequestException('Invalid session');
        }

        // Only pending_payment orders can be cancelled by user
        if (order.status !== 'pending_payment') {
            throw new BadRequestException(
                `Cannot cancel order in status: ${order.status}`,
            );
        }

        await this.cancelOrderAndReleaseInventory(
            orderId,
            reason || 'Cancelled by user',
        );
    }

    // ============================================
    // PRIVATE HELPER METHODS
    // ============================================

    /**
     * Fetch cart and product variants
     */
    private async getCartAndVariants(userId?: string, sessionId?: string) {
        const cart = await this.prisma.cart.findFirst({
            where: userId ? { userId } : { sessionId },
            include: { items: true },
        });

        if (!cart || cart.items.length === 0) {
            return { cart: null, variants: [] };
        }

        const variantIds = cart.items.map((item) => item.productVariantId);
        const variants = await this.prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: {
                inventoryItems: true,
                product: {
                    select: { name: true },
                },
            },
        });

        return { cart, variants };
    }

    /**
     * Validate stock availability
     * @throws ConflictException if insufficient stock
     */
    private validateStockAvailability(cartItems: any[], variants: any[]): void {
        for (const item of cartItems) {
            const variant = variants.find((v) => v.id === item.productVariantId);
            if (!variant) {
                throw new NotFoundException(
                    `Product variant ${item.productVariantId} not found`,
                );
            }

            const totalStock = variant.inventoryItems.reduce(
                (sum: number, inv: any) => sum + inv.quantity - inv.reservedQuantity,
                0,
            );

            if (totalStock < item.quantity) {
                throw new ConflictException(
                    `Insufficient stock for product: ${variant.product.name}`,
                );
            }
        }
    }

    /**
     * Calculate order totals
     */
    private calculateOrderTotals(
        cartItems: any[],
        variants: any[],
        shippingMethodId?: string,
    ) {
        const orderItemsData = cartItems.map((item) => {
            const variant = variants.find((v) => v.id === item.productVariantId);
            const price = Number(variant.price);
            const totalLine = price * item.quantity;

            return {
                productVariantId: variant.id,
                productName: variant.product.name,
                sku: variant.sku,
                variantTitle: variant.variantTitle || {},
                quantity: item.quantity,
                price,
                totalLine,
            };
        });

        const subTotal = orderItemsData.reduce(
            (sum, item) => sum + item.totalLine,
            0,
        );
        const shippingFee = this.SHIPPING_FEE;
        const totalAmount = subTotal + shippingFee;

        return { orderItemsData, subTotal, totalAmount };
    }

    /**
     * Reserve inventory (soft lock)
     * Creates InventoryReservation record and increments reservedQuantity
     */
    private async reserveInventory(
        tx: Prisma.TransactionClient,
        cartItems: any[],
        variants: any[],
        expiresAt: Date,
    ): Promise<string> {
        // For simplicity, we'll create one reservation per order
        // In production, you might want one reservation per variant
        const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const firstVariantId = cartItems[0].productVariantId;

        // Increment reservedQuantity on inventory items
        for (const item of cartItems) {
            const variant = variants.find((v) => v.id === item.productVariantId);
            const inventoryItem = variant.inventoryItems[0]; // Assuming single warehouse

            if (!inventoryItem) {
                throw new ConflictException(
                    `No inventory found for variant ${variant.sku}`,
                );
            }

            await tx.inventoryItem.update({
                where: { id: inventoryItem.id },
                data: {
                    reservedQuantity: {
                        increment: item.quantity,
                    },
                },
            });
        }

        // Create reservation record (placeholder - will link to order after creation)
        const reservation = await tx.inventoryReservation.create({
            data: {
                orderId: 'temp', // Will be updated after order creation
                variantId: firstVariantId,
                quantity: totalQuantity,
                expiresAt,
                status: 'active',
            },
        });

        return reservation.id;
    }

    /**
     * Create order record
     */
    private async createOrder(
        tx: Prisma.TransactionClient,
        params: {
            userId?: string;
            sessionId?: string;
            dto: CreateOrderWithPaymentDto;
            orderItemsData: any[];
            subTotal: number;
            totalAmount: number;
            status: string;
            paymentDeadline: Date | null;
            reservationId: string | null;
        },
    ) {
        const orderCode = this.generateOrderCode();

        const order = await tx.order.create({
            data: {
                code: orderCode,
                userId: params.userId,
                sessionId: params.sessionId,
                status: params.status as any,
                paymentStatus: 'unpaid',
                paymentMethod: params.dto.paymentMethod as any,
                paymentDeadline: params.paymentDeadline,
                reservationId: params.reservationId || undefined,
                shippingAddress: params.dto.shippingAddress as any,
                billingAddress: (params.dto.billingAddress || params.dto.shippingAddress) as any,
                shippingMethodId: params.dto.shippingMethodId,
                currency: 'VND',
                subTotal: params.subTotal,
                shippingFee: this.SHIPPING_FEE,
                totalAmount: params.totalAmount,
                note: params.dto.note,
                items: {
                    create: params.orderItemsData,
                },
            },
            include: { items: true },
        });

        // Update reservation with actual orderId
        if (params.reservationId) {
            await tx.inventoryReservation.update({
                where: { id: params.reservationId },
                data: { orderId: order.id },
            });
        }

        // Create timeline entry
        await tx.orderTimeline.create({
            data: {
                orderId: order.id,
                action: 'order_created',
                toStatus: params.status as any,
                description: `Order created with payment method: ${params.dto.paymentMethod}`,
                actorType: 'system',
            },
        });

        return order;
    }

    /**
     * Create payment transaction record
     */
    private async createPaymentTransaction(
        tx: Prisma.TransactionClient,
        params: {
            orderId: string;
            amount: number;
            provider: string;
            status: string;
        },
    ) {
        const transactionCode = this.generateTransactionCode();

        return tx.paymentTransaction.create({
            data: {
                orderId: params.orderId,
                amount: params.amount,
                currency: 'VND',
                type: 'payment',
                status: params.status as any,
                provider: params.provider,
                transactionCode,
            },
        });
    }

    /**
     * Deduct inventory (for COD orders)
     */
    private async deductInventory(
        tx: Prisma.TransactionClient,
        cartItems: any[],
        variants: any[],
        orderId: string,
    ): Promise<void> {
        for (const item of cartItems) {
            const variant = variants.find((v) => v.id === item.productVariantId);
            const inventoryItem = variant.inventoryItems[0];

            await tx.inventoryItem.update({
                where: { id: inventoryItem.id },
                data: {
                    quantity: {
                        decrement: item.quantity,
                    },
                },
            });

            // Log inventory change
            await tx.inventoryLog.create({
                data: {
                    inventoryItemId: inventoryItem.id,
                    productVariantId: variant.id,
                    warehouseId: inventoryItem.warehouseId,
                    actionType: 'SALE',
                    quantityChange: -item.quantity,
                    stockAfter: inventoryItem.quantity - item.quantity,
                    referenceId: orderId,
                    note: `Order ${orderId} confirmed (COD)`,
                },
            });
        }
    }

    /**
     * Deduct inventory from confirmed order (for online payment)
     */
    private async deductInventoryFromOrder(
        tx: Prisma.TransactionClient,
        orderItems: any[],
        variants: any[],
        orderId: string,
    ): Promise<void> {
        for (const item of orderItems) {
            const variant = variants.find((v) => v.id === item.productVariantId);
            const inventoryItem = variant.inventoryItems[0];

            // Deduct from both quantity and reservedQuantity
            await tx.inventoryItem.update({
                where: { id: inventoryItem.id },
                data: {
                    quantity: {
                        decrement: item.quantity,
                    },
                    reservedQuantity: {
                        decrement: item.quantity,
                    },
                },
            });

            // Log inventory change
            await tx.inventoryLog.create({
                data: {
                    inventoryItemId: inventoryItem.id,
                    productVariantId: variant.id,
                    warehouseId: inventoryItem.warehouseId,
                    actionType: 'SALE',
                    quantityChange: -item.quantity,
                    stockAfter: inventoryItem.quantity - item.quantity,
                    referenceId: orderId,
                    note: `Order confirmed after payment`,
                },
            });
        }
    }

    /**
     * Cancel order and release inventory
     * Idempotent operation
     */
    private async cancelOrderAndReleaseInventory(
        orderId: string,
        reason?: string,
    ): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true },
            });

            if (!order) {
                throw new NotFoundException(`Order ${orderId} not found`);
            }

            // Idempotency: Skip if already cancelled
            if (order.status === 'cancelled') {
                this.logger.log(`Order ${orderId} already cancelled, skipping`);
                return;
            }

            // Release inventory reservations
            if (order.reservationId) {
                const variantIds = order.items.map((item) => item.productVariantId).filter((id): id is string => id !== null);
                const variants = await tx.productVariant.findMany({
                    where: { id: { in: variantIds } },
                    include: { inventoryItems: true },
                });

                for (const item of order.items) {
                    const variant = variants.find((v) => v.id === item.productVariantId);
                    const inventoryItem = variant?.inventoryItems[0];

                    if (inventoryItem) {
                        await tx.inventoryItem.update({
                            where: { id: inventoryItem.id },
                            data: {
                                reservedQuantity: {
                                    decrement: item.quantity,
                                },
                            },
                        });
                    }
                }

                // Update reservation status
                await tx.inventoryReservation.updateMany({
                    where: { orderId },
                    data: { status: 'released' },
                });
            }

            // Update order status
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'cancelled',
                    cancelReason: reason || 'Payment failed',
                    cancelledAt: new Date(),
                },
            });

            // Update payment status
            await tx.paymentTransaction.updateMany({
                where: { orderId },
                data: { status: 'failed' },
            });

            // Create timeline entry
            await tx.orderTimeline.create({
                data: {
                    orderId,
                    action: 'order_cancelled',
                    fromStatus: order.status,
                    toStatus: 'cancelled',
                    description: reason || 'Order cancelled',
                    actorType: 'system',
                },
            });
        });

        this.logger.log(`Order ${orderId} cancelled and inventory released`);
    }

    /**
     * Build response DTO
     */
    private buildOrderPaymentResponse(
        order: any,
        payment: any,
        paymentUrl: string | null,
        isCOD: boolean,
    ): OrderPaymentResponseDto {
        const orderSummary: OrderSummaryDto = {
            id: order.id,
            code: order.code,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentDeadline: order.paymentDeadline,
            totalAmount: Number(order.totalAmount),
            currency: order.currency,
            createdAt: order.createdAt,
        };

        const paymentDetails: PaymentDetailsDto = {
            id: payment.id,
            paymentUrl,
            transactionCode: payment.transactionCode,
            provider: payment.provider,
            status: payment.status,
        };

        const flowStatus: PaymentFlowStatus = isCOD
            ? PaymentFlowStatus.CONFIRMED
            : PaymentFlowStatus.PENDING_PAYMENT;

        const message = isCOD
            ? 'Order confirmed successfully. Payment on delivery.'
            : 'Order created successfully. Please complete payment within 15 minutes.';

        return {
            order: orderSummary,
            payment: paymentDetails,
            flowStatus,
            message,
        };
    }

    /**
     * Generate unique order code
     */
    private generateOrderCode(): string {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0');
        return `${this.ORDER_CODE_PREFIX}-${dateStr}-${random}`;
    }

    /**
     * Generate unique transaction code
     */
    private generateTransactionCode(): string {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0');
        return `TXN-${dateStr}-${random}`;
    }
}
