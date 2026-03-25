import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { ActionType, OrderStatusEnum, PaymentStatusEnum, PaymentMethodEnum, TransactionStatusEnum, TransactionTypeEnum, ReservationStatus, Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { VietQRProvider } from './providers/vietqr/vietqr.provider';
import { PayPalProvider } from './providers/paypal/paypal.provider';
import { VNPayProvider } from './providers/vnpay/vnpay.provider';
import { IdempotencyService } from './services/idempotency.service';
import {
    CallbackData,
    IPaymentProvider,
    PaymentMethodEnum as PaymentProviderMethodEnum,
    PaymentResult,
    RefundResult,
    TransactionStatus,
} from './types/payment.types';

/**
 * Payment Service
 * Orchestrates payment operations across different providers
 */
@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    private readonly providers: Map<PaymentMethodEnum, IPaymentProvider>;

    constructor(
        private readonly prisma: PrismaService,
        private readonly vnpayProvider: VNPayProvider,
        private readonly paypalProvider: PayPalProvider,
        private readonly vietqrProvider: VietQRProvider,
        private readonly idempotencyService: IdempotencyService,
    ) {
        // Register payment providers
        this.providers = new Map<PaymentMethodEnum, IPaymentProvider>([
            [PaymentMethodEnum.VNPAY, this.vnpayProvider],
            [PaymentMethodEnum.PAYPAL, this.paypalProvider],
            [PaymentMethodEnum.VIETQR, this.vietqrProvider],
        ]);
    }

    /**
     * Create payment for an order (with idempotency)
     */
    async createPayment(
        orderId: string,
        paymentMethod: PaymentMethodEnum,
        metadata?: Record<string, any>,
    ): Promise<PaymentResult> {
        // Generate idempotency key
        const idempotencyKey = this.idempotencyService.generatePaymentKey(
            orderId,
            'create',
        );

        // Check for cached result
        const cachedResult = await this.idempotencyService.getResult(idempotencyKey);
        if (cachedResult) {
            this.logger.log(
                `Returning cached payment result for order ${orderId}`,
            );
            return cachedResult;
        }

        // Acquire distributed lock
        const lockToken = await this.idempotencyService.acquireLock(idempotencyKey);
        if (!lockToken) {
            // Another request is processing this payment
            throw new ConflictException(
                'Payment creation already in progress. Please wait.',
            );
        }

        try {
            // Fetch order
            const order = await this.prisma.order.findUnique({
                where: { id: orderId },
                include: { transactions: true },
            });

            if (!order) {
                throw new NotFoundException(`Order ${orderId} not found`);
            }

            // Check if order already has a successful payment
            const hasSuccessfulPayment = order.transactions.some(
                (tx) => tx.status === TransactionStatusEnum.success && tx.type === TransactionTypeEnum.payment,
            );

            if (hasSuccessfulPayment) {
                throw new BadRequestException('Order already paid');
            }

            // Get provider
            const provider = this.getProvider(paymentMethod);

            // Create payment
            const result = await provider.createPayment(
                orderId,
                Number(order.totalAmount),
                metadata,
            );

            // Create transaction record
            await this.prisma.paymentTransaction.create({
                data: {
                    orderId,
                    amount: order.totalAmount,
                    type: TransactionTypeEnum.payment,
                    status: TransactionStatusEnum.pending,
                    provider: paymentMethod,
                    method: paymentMethod,
                    transactionCode: result.transactionId,
                    gatewayResponse: result.metadata || {},
                },
            });

            this.logger.log(
                `Payment created for order ${orderId}, method: ${paymentMethod}, transaction: ${result.transactionId}`,
            );

            // Cache result
            await this.idempotencyService.storeResult(idempotencyKey, result);

            return result;
        } finally {
            // Always release lock
            await this.idempotencyService.releaseLock(idempotencyKey, lockToken);
        }
    }

    /**
     * Process payment callback from gateway (with idempotency)
     */
    async processCallback(
        paymentMethod: PaymentMethodEnum,
        callbackData: Record<string, any>,
    ): Promise<CallbackData> {
        this.logger.log(`Processing callback for ${paymentMethod}`);
        const provider = this.getProvider(paymentMethod);

        // Verify callback first (to get transaction ID)
        const verifiedData = await provider.verifyCallback(callbackData);

        // Generate idempotency key using transaction ID
        const idempotencyKey = this.idempotencyService.generateCallbackKey(
            verifiedData.transactionId,
            paymentMethod,
        );

        // Check if this callback was already processed
        const cachedResult = await this.idempotencyService.getResult(idempotencyKey);
        if (cachedResult) {
            this.logger.log(
                `Callback already processed for transaction ${verifiedData.transactionId}`,
            );
            return cachedResult;
        }

        // Acquire lock to prevent concurrent callback processing
        const lockToken = await this.idempotencyService.acquireLock(idempotencyKey);
        if (!lockToken) {
            // Another callback is being processed
            this.logger.warn(
                `Concurrent callback detected for transaction ${verifiedData.transactionId}`,
            );
            throw new ConflictException(
                'Callback already being processed. Please wait.',
            );
        }

        try {
            // Update order and transaction in a transaction
            await this.prisma.$transaction(async (tx) => {
                // 1. Find transaction by transactionCode (Database-level idempotency check)
                const transaction = await tx.paymentTransaction.findFirst({
                    where: { transactionCode: verifiedData.transactionId as string },
                    include: { order: true },
                }) as any;

                if (!transaction) {
                    throw new NotFoundException(`Transaction ${verifiedData.transactionId} not found`);
                }

                const order = transaction.order;

                // 2. Check if transaction already successful or order already paid
                if (transaction.status === TransactionStatusEnum.success || order.paymentStatus === 'paid') {
                    this.logger.warn(`Transaction ${verifiedData.transactionId} already processed, skipping.`);
                    return;
                }

                // 3. Update transaction status
                await tx.paymentTransaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: verifiedData.status,
                        gatewayResponse: verifiedData.gatewayResponse,
                    },
                });

                // 4. Update order status based on payment result
                if (verifiedData.status === TransactionStatus.SUCCESS) {
                    await tx.order.update({
                        where: { id: order.id },
                        data: {
                            paymentStatus: PaymentStatusEnum.paid,
                            status: OrderStatusEnum.confirmed,
                            confirmedAt: new Date(),
                            retryCount: 0, 
                        } as any,
                    });

                    // 5. Deduct inventory (Confirming the reservation)
                    // We call the inventory service's deduct method directly here to avoid circular dep with OrderPaymentService
                    // Or we could trigger an event. For now, manual deduction logic similar to InventoryService.deduct:
                    const reservations = await tx.inventoryReservation.findMany({
                        where: { orderId: order.id, status: ReservationStatus.active },
                    });

                    for (const res of reservations) {
                        const inventoryItem = await tx.inventoryItem.findFirst({
                            where: { productVariantId: res.variantId, warehouseId: res.warehouseId },
                        });

                        if (inventoryItem) {
                            await tx.inventoryItem.update({
                                where: { id: inventoryItem.id },
                                data: {
                                    quantity: { decrement: res.quantity },
                                    reservedQuantity: { decrement: res.quantity },
                                },
                            });

                            await tx.inventoryReservation.update({
                                where: { id: res.id },
                                data: { status: ReservationStatus.confirmed },
                            });

                            await tx.inventoryLog.create({
                                data: {
                                    inventoryItemId: inventoryItem.id,
                                    productVariantId: res.variantId,
                                    warehouseId: res.warehouseId,
                                    actionType: ActionType.SALE,
                                    quantityChange: -res.quantity,
                                    beforeQuantity: inventoryItem.quantity,
                                    afterQuantity: inventoryItem.quantity - res.quantity,
                                    referenceId: order.id,
                                    referenceType: 'ORDER',
                                    note: `Auto-deducted via payment webhook for ${paymentMethod}`,
                                },
                            });
                        }
                    }

                    await tx.orderTimeline.create({
                        data: {
                            orderId: order.id,
                            action: 'PAYMENT_CONFIRMED',
                            toStatus: 'confirmed',
                            description: `Payment success via ${paymentMethod}. Order confirmed and stock deducted.`,
                            actorType: 'system',
                            metadata: { transactionId: verifiedData.transactionId },
                        },
                    });
                } else {
                    // Payment failed or cancelled
                    const isMaxRetries = order.retryCount >= 5;
                    const nextStatus = isMaxRetries ? OrderStatusEnum.cancelled : OrderStatusEnum.pending_payment;

                    await tx.order.update({
                        where: { id: order.id },
                        data: {
                            status: nextStatus,
                            retryCount: { increment: 1 },
                        } as any,
                    });

                    if (isMaxRetries) {
                        // Release inventory if max retries reached or payment cancelled permanently
                        // Similar to InventoryService.release
                        const reservations = await tx.inventoryReservation.findMany({
                            where: { orderId: order.id, status: ReservationStatus.active },
                        });

                        for (const res of reservations) {
                            await tx.inventoryItem.updateMany({
                                where: { productVariantId: res.variantId, warehouseId: res.warehouseId },
                                data: { reservedQuantity: { decrement: res.quantity } },
                            });

                            await tx.inventoryReservation.update({
                                where: { id: res.id },
                                data: { status: ReservationStatus.released },
                            });
                        }
                    }

                    await tx.orderTimeline.create({
                        data: {
                            orderId: order.id,
                            action: 'PAYMENT_FAILED',
                            toStatus: nextStatus,
                            description: `Payment failed via ${paymentMethod}. ${isMaxRetries ? 'Max retries reached, order cancelled.' : 'Waiting for retry.'}`,
                            actorType: 'system',
                            metadata: { transactionId: verifiedData.transactionId, retryCount: order.retryCount + 1 },
                        },
                    });
                }
            });

            this.logger.log(
                `Payment callback processed for order ${verifiedData.orderId}, status: ${verifiedData.status}`,
            );

            // Cache the result
            await this.idempotencyService.storeResult(idempotencyKey, verifiedData);

            return verifiedData;
        } finally {
            // Always release lock
            await this.idempotencyService.releaseLock(idempotencyKey, lockToken);
        }
    }

    /**
     * Process refund for an order (with idempotency)
     */
    async processRefund(
        orderId: string,
        amount: number,
        reason?: string,
        restoreInventory: boolean = true,
    ): Promise<RefundResult> {
        // Generate idempotency key
        const idempotencyKey = this.idempotencyService.generatePaymentKey(
            orderId,
            'refund',
        );

        // Check for cached result
        const cachedResult = await this.idempotencyService.getResult(idempotencyKey);
        if (cachedResult) {
            this.logger.log(
                `Returning cached refund result for order ${orderId}`,
            );
            return cachedResult;
        }

        // Acquire lock
        const lockToken = await this.idempotencyService.acquireLock(idempotencyKey);
        if (!lockToken) {
            throw new ConflictException(
                'Refund already in progress. Please wait.',
            );
        }

        try {
            return await this.prisma.$transaction(async (tx) => {
                // Find order with transactions
                const order = await tx.order.findUnique({
                    where: { id: orderId },
                    include: {
                        transactions: true,
                        items: true,
                    },
                });

                if (!order) {
                    throw new NotFoundException(`Order ${orderId} not found`);
                }

                // Check if already refunded
                const existingRefund = order.transactions.find(
                    (t) => t.type === TransactionTypeEnum.refund && t.status === TransactionStatusEnum.success,
                );

                if (existingRefund) {
                    throw new BadRequestException('Order already refunded');
                }

                // Find successful payment transaction
                const paymentTransaction = order.transactions.find(
                    (t) => t.status === TransactionStatusEnum.success && t.type === TransactionTypeEnum.payment,
                );

                if (!paymentTransaction) {
                    throw new BadRequestException('No successful payment found for order');
                }

                // Validate refund amount
                if (amount > Number(order.totalAmount)) {
                    throw new BadRequestException(
                        'Refund amount cannot exceed order total',
                    );
                }

                // Get provider
                const provider = this.getProvider(
                    paymentTransaction.provider as PaymentMethodEnum,
                );

                // Process refund with provider
                const refundResult = await provider.processRefund(
                    paymentTransaction.transactionCode || '',
                    amount,
                    reason,
                );

                // Create refund transaction
                await tx.paymentTransaction.create({
                    data: {
                        orderId,
                        amount,
                        type: TransactionTypeEnum.refund,
                        status: refundResult.success ? TransactionStatusEnum.success : TransactionStatusEnum.failed,
                        provider: paymentTransaction.provider,
                        method: paymentTransaction.method,
                        transactionCode: refundResult.refundTransactionId,
                        gatewayResponse: refundResult.metadata || {},
                        note: reason,
                    },
                });

                // Update order status
                await tx.order.update({
                    where: { id: orderId },
                    data: {
                        paymentStatus: PaymentStatusEnum.refunded,
                        status: OrderStatusEnum.refunded,
                    },
                });

                // Restore inventory if requested
                if (restoreInventory) {
                    await this.restoreInventory(tx, order);
                }

                // Create order timeline entry
                await tx.orderTimeline.create({
                    data: {
                        orderId,
                        action: 'REFUND_PROCESSED',
                        toStatus: OrderStatusEnum.refunded,
                        description: `Refund processed: ${amount} VND. Reason: ${reason || 'N/A'}`,
                        actorType: 'system',
                        metadata: {
                            refundTransactionId: refundResult.refundTransactionId,
                            amount,
                            reason,
                        },
                    },
                });

                this.logger.log(
                    `Refund processed for order ${orderId}, amount: ${amount}, transaction: ${refundResult.refundTransactionId}`,
                );

                // Cache result
                await this.idempotencyService.storeResult(idempotencyKey, refundResult);

                return refundResult;
            });
        } finally {
            // Always release lock
            await this.idempotencyService.releaseLock(idempotencyKey, lockToken);
        }
    }

    /**
     * Confirm VIETQR payment (manual confirmation by staff)
     */
    async confirmVietQRPayment(
        orderId: string,
        amount: number,
        confirmedBy: string,
        note?: string,
    ): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { transactions: true },
            });

            if (!order) {
                throw new NotFoundException(`Order ${orderId} not found`);
            }

            // Find pending VIETQR transaction
            const vietqrTransaction = order.transactions.find(
                (t) => t.provider === PaymentMethodEnum.VIETQR && t.status === TransactionStatusEnum.pending,
            );

            if (!vietqrTransaction) {
                throw new BadRequestException('No pending VIETQR transaction found');
            }

            // Update transaction
            await tx.paymentTransaction.update({
                where: { id: vietqrTransaction.id },
                data: {
                    status: TransactionStatusEnum.success,
                    gatewayResponse: {
                        confirmedBy,
                        confirmedAt: new Date().toISOString(),
                        note,
                    },
                },
            });

            // Update order
            await tx.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: PaymentStatusEnum.paid,
                    status: OrderStatusEnum.confirmed,
                    confirmedAt: new Date(),
                },
            });

            // Create timeline
            await tx.orderTimeline.create({
                data: {
                    orderId,
                    action: 'VIETQR_PAYMENT_CONFIRMED',
                    toStatus: 'confirmed',
                    description: `VietQR payment confirmed by staff`,
                    actorId: confirmedBy,
                    actorType: 'staff',
                    metadata: { amount, note },
                },
            });
        });

        this.logger.log(`VietQR payment confirmed for order ${orderId}`);
    }

    /**
     * Get payment status for an order
     */
    async getPaymentStatus(orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!order) {
            throw new NotFoundException(`Order ${orderId} not found`);
        }

        return {
            orderId: order.id,
            orderCode: order.code,
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount,
            transactions: order.transactions,
        };
    }

    /**
     * Restore inventory after refund
     */
    private async restoreInventory(
        tx: Prisma.TransactionClient,
        order: Prisma.OrderGetPayload<{ include: { items: true } }>,
    ): Promise<void> {
        // Find all original deduction logs for this order to know exactly where to return stock
        const deductionLogs = await tx.inventoryLog.findMany({
            where: {
                referenceId: order.id,
                referenceType: 'ORDER',
                actionType: ActionType.SALE,
                quantityChange: { lt: 0 },
            },
        });

        if (deductionLogs.length === 0) {
            this.logger.warn(`No inventory deduction logs found for order ${order.id}. Skipping restoration.`);
            return;
        }

        for (const log of deductionLogs) {
            const quantityToRestore = Math.abs(log.quantityChange);

            // Fetch current inventory item to get accurate beforeQuantity for logging
            const inventoryItem = await tx.inventoryItem.findUnique({
                where: { id: log.inventoryItemId },
            });

            if (!inventoryItem) {
                this.logger.error(`Inventory item ${log.inventoryItemId} not found during restoration for order ${order.id}`);
                continue;
            }

            // Restore stock
            await tx.inventoryItem.update({
                where: { id: inventoryItem.id },
                data: {
                    quantity: { increment: quantityToRestore },
                },
            });

            // Create return log
            await tx.inventoryLog.create({
                data: {
                    inventoryItemId: inventoryItem.id,
                    productVariantId: log.productVariantId,
                    warehouseId: log.warehouseId,
                    actionType: ActionType.RETURN,
                    quantityChange: quantityToRestore,
                    beforeQuantity: inventoryItem.quantity,
                    afterQuantity: inventoryItem.quantity + quantityToRestore,
                    referenceType: 'ORDER',
                    referenceId: order.id,
                    note: 'Inventory restored to original warehouse due to refund',
                },
            });
        }

        this.logger.log(`Inventory restored for order ${order.id} across ${deductionLogs.length} warehouse locations`);
    }

    /**
     * Get payment provider by method
     */
    private getProvider(method: PaymentMethodEnum): IPaymentProvider {
        const provider = this.providers.get(method);
        if (!provider) {
            throw new BadRequestException(`Unsupported payment method: ${method}`);
        }
        return provider;
    }

    /**
     * Generate payment URL for order
     * Used by OrderPaymentService for order-payment integration
     * 
     * @param orderId - Order ID
     * @param orderCode - Order code for display
     * @param amount - Payment amount
     * @param provider - Payment provider (VIETQR/VNPAY/PAYPAL)
     * @param returnUrl - Optional return URL
     * @param cancelUrl - Optional cancel URL
     * @returns Payment URL or null for VIETQR
     */
    async generatePaymentUrl(
        orderId: string,
        orderCode: string,
        amount: number,
        provider: string,
        returnUrl?: string,
        cancelUrl?: string,
    ): Promise<string | null> {
        this.logger.log(
            `Generating payment URL: provider=${provider}, orderId=${orderId}`,
        );

        // VIETQR doesn't need payment URL (static QR or manual)
        if (provider === 'VIETQR' || provider === 'COD') {
            return null;
        }

        const metadata = {
            orderId,
            orderCode,
            returnUrl: returnUrl || process.env.FRONTEND_URL + '/order/success' || '',
            cancelUrl: cancelUrl || process.env.FRONTEND_URL + '/order/cancel' || '',
        };

        try {
            let paymentMethod: PaymentMethodEnum;
            if (provider === 'VNPAY') {
                paymentMethod = PaymentMethodEnum.VNPAY;
            } else if (provider === 'PAYPAL') {
                paymentMethod = PaymentMethodEnum.PAYPAL;
            } else if (provider === 'VIETQR' || provider === 'COD') {
                 paymentMethod = PaymentMethodEnum.VIETQR;
            } else {
                throw new BadRequestException(`Unsupported payment provider: ${provider}`);
            }

            const paymentProvider = this.getProvider(paymentMethod);
            const result = await paymentProvider.createPayment(
                orderId,
                amount,
                metadata,
            );

            return result.paymentUrl || null;
        } catch (error) {
            this.logger.error(
                `Failed to generate payment URL for provider ${provider}`,
                error,
            );
            throw error;
        }
    }
    /**
     * Get PayPal provider for advanced operations
     */
    getPayPalProvider(): PayPalProvider {
        return this.paypalProvider;
    }

    /**
     * Find all transactions for admin (paginated)
     */
    async findTransactions(filters: {
        page?: number;
        limit?: number;
        status?: string;
        provider?: string;
        orderCode?: string;
    }) {
        const {
            page = 1,
            limit = 10,
            status,
            provider,
            orderCode,
        } = filters;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const where: Prisma.PaymentTransactionWhereInput = {};
        if (status) where.status = status as TransactionStatus;
        if (provider) where.provider = provider;
        if (orderCode) {
            where.order = {
                code: {
                    contains: orderCode,
                    mode: 'insensitive',
                },
            };
        }

        const [items, total] = await Promise.all([
            this.prisma.paymentTransaction.findMany({
                where,
                skip,
                take,
                include: {
                    order: {
                        select: {
                            id: true,
                            code: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.paymentTransaction.count({ where }),
        ]);

        return {
            items,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        };
    }
}
