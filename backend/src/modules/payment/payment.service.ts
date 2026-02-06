import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CODProvider } from './providers/cod/cod.provider';
import { PayPalProvider } from './providers/paypal/paypal.provider';
import { VNPayProvider } from './providers/vnpay/vnpay.provider';
import { IdempotencyService } from './services/idempotency.service';
import {
    CallbackData,
    IPaymentProvider,
    PaymentMethodEnum,
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
        private readonly codProvider: CODProvider,
        private readonly idempotencyService: IdempotencyService,
    ) {
        // Register payment providers
        this.providers = new Map<PaymentMethodEnum, IPaymentProvider>([
            [PaymentMethodEnum.VNPAY, this.vnpayProvider],
            [PaymentMethodEnum.PAYPAL, this.paypalProvider],
            [PaymentMethodEnum.COD, this.codProvider],
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
                (tx) => tx.status === 'success' && tx.type === 'payment',
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
                    type: 'payment',
                    status: 'pending',
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
                // Find order
                const order = await tx.order.findUnique({
                    where: { id: verifiedData.orderId },
                    include: { transactions: true },
                });

                if (!order) {
                    throw new NotFoundException(
                        `Order ${verifiedData.orderId} not found`,
                    );
                }

                // Find transaction
                const transaction = order.transactions.find(
                    (t) => t.transactionCode === verifiedData.transactionId,
                );

                if (!transaction) {
                    throw new NotFoundException(
                        `Transaction ${verifiedData.transactionId} not found`,
                    );
                }

                // Check if transaction already processed (double-check)
                if (transaction.status === 'success') {
                    this.logger.warn(
                        `Transaction ${verifiedData.transactionId} already successful, skipping update`,
                    );
                    return;
                }

                // Update transaction status
                await tx.paymentTransaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: verifiedData.status,
                        gatewayResponse: verifiedData.gatewayResponse,
                    },
                });

                // Update order payment status
                if (verifiedData.status === TransactionStatus.SUCCESS) {
                    await tx.order.update({
                        where: { id: verifiedData.orderId },
                        data: {
                            paymentStatus: 'paid',
                            status: 'confirmed',
                            confirmedAt: new Date(),
                        },
                    });

                    // Create order timeline entry
                    await tx.orderTimeline.create({
                        data: {
                            orderId: verifiedData.orderId,
                            action: 'PAYMENT_CONFIRMED',
                            toStatus: 'confirmed',
                            description: `Payment confirmed via ${paymentMethod}`,
                            actorType: 'system',
                            metadata: {
                                transactionId: verifiedData.transactionId,
                                paymentMethod,
                            },
                        },
                    });
                } else if (verifiedData.status === TransactionStatus.FAILED) {
                    await tx.order.update({
                        where: { id: verifiedData.orderId },
                        data: {
                            paymentStatus: 'unpaid',
                        },
                    });

                    // Create order timeline entry
                    await tx.orderTimeline.create({
                        data: {
                            orderId: verifiedData.orderId,
                            action: 'PAYMENT_FAILED',
                            description: `Payment failed via ${paymentMethod}`,
                            actorType: 'system',
                            metadata: {
                                transactionId: verifiedData.transactionId,
                                paymentMethod,
                            },
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
                    (t) => t.type === 'refund' && t.status === 'success',
                );

                if (existingRefund) {
                    throw new BadRequestException('Order already refunded');
                }

                // Find successful payment transaction
                const paymentTransaction = order.transactions.find(
                    (t) => t.status === 'success' && t.type === 'payment',
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
                        type: 'refund',
                        status: refundResult.success ? 'success' : 'failed',
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
                        paymentStatus: 'refunded',
                        status: 'refunded',
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
                        toStatus: 'refunded',
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
     * Confirm COD payment (manual confirmation by staff)
     */
    async confirmCODPayment(
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

            // Find pending COD transaction
            const codTransaction = order.transactions.find(
                (t) => t.provider === 'COD' && t.status === 'pending',
            );

            if (!codTransaction) {
                throw new BadRequestException('No pending COD transaction found');
            }

            // Update transaction
            await tx.paymentTransaction.update({
                where: { id: codTransaction.id },
                data: {
                    status: 'success',
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
                    paymentStatus: 'paid',
                    status: 'confirmed',
                    confirmedAt: new Date(),
                },
            });

            // Create timeline
            await tx.orderTimeline.create({
                data: {
                    orderId,
                    action: 'COD_PAYMENT_CONFIRMED',
                    toStatus: 'confirmed',
                    description: `COD payment confirmed by staff`,
                    actorId: confirmedBy,
                    actorType: 'staff',
                    metadata: { amount, note },
                },
            });
        });

        this.logger.log(`COD payment confirmed for order ${orderId}`);
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
    private async restoreInventory(tx: any, order: any): Promise<void> {
        for (const item of order.items) {
            if (!item.productVariantId) continue;

            // Find inventory items for this variant
            const inventoryItems = await tx.inventoryItem.findMany({
                where: { productVariantId: item.productVariantId },
                orderBy: { updatedAt: 'desc' },
            });

            if (inventoryItems.length === 0) continue;

            // Restore to first warehouse
            const inventoryItem = inventoryItems[0];

            await tx.inventoryItem.update({
                where: { id: inventoryItem.id },
                data: {
                    quantity: { increment: item.quantity },
                },
            });

            // Create inventory log
            await tx.inventoryLog.create({
                data: {
                    inventoryItemId: inventoryItem.id,
                    productVariantId: item.productVariantId,
                    warehouseId: inventoryItem.warehouseId,
                    actionType: 'RETURN',
                    quantityChange: item.quantity,
                    stockAfter: inventoryItem.quantity + item.quantity,
                    referenceId: order.id,
                    referenceCode: order.code,
                    note: 'Inventory restored due to refund',
                },
            });
        }

        this.logger.log(`Inventory restored for order ${order.id}`);
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
     * @param provider - Payment provider (COD/VNPAY/PAYPAL)
     * @param returnUrl - Optional return URL
     * @param cancelUrl - Optional cancel URL
     * @returns Payment URL or null for COD
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

        // COD doesn't need payment URL
        if (provider === 'COD') {
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
}
