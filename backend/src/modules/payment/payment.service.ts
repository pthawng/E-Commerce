import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { 
    ActionType, 
    OrderStatusEnum, 
    PaymentStatusEnum, 
    PaymentMethodEnum, 
    TransactionStatusEnum, 
    TransactionTypeEnum, 
    ReservationStatus, 
    Prisma, 
    PaymentProcessingStatus, 
    PaymentGatewayProvider 
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { VietQRProvider } from './providers/vietqr/vietqr.provider';
import { PayPalProvider } from './providers/paypal/paypal.provider';
import { VNPayProvider } from './providers/vnpay/vnpay.provider';
import { IdempotencyService } from './services/idempotency.service';
import { PaymentStateMachine } from './services/payment-state.machine';
import { InventoryService } from '../inventory/inventory.service';
import {
    CallbackData,
    IPaymentGatewayProvider,
    PaymentMethodEnum as PaymentGatewayProviderMethodEnum,
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
    private readonly providers: Map<PaymentMethodEnum, IPaymentGatewayProvider>;

    constructor(
        private readonly prisma: PrismaService,
        private readonly vnpayProvider: VNPayProvider,
        private readonly paypalProvider: PayPalProvider,
        private readonly vietqrProvider: VietQRProvider,
        private readonly idempotencyService: IdempotencyService,
        private readonly stateMachine: PaymentStateMachine,
        private readonly inventoryService: InventoryService,
    ) {
        // Register payment providers
        this.providers = new Map<PaymentMethodEnum, IPaymentGatewayProvider>([
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

            // 1. Create Payment record (Source of Truth)
            // Using a transaction to ensure both Payment and PaymentTransaction are created
            await this.prisma.$transaction(async (tx) => {
                await tx.payment.create({
                    data: {
                        orderId,
                        provider: paymentMethod as unknown as PaymentGatewayProvider,
                        providerTransactionId: result.transactionId,
                        amount: order.totalAmount,
                        amountUsd: result.metadata?.amountUsd ? new Prisma.Decimal(result.metadata.amountUsd) : null,
                        exchangeRate: result.metadata?.exchangeRate ? new Prisma.Decimal(result.metadata.exchangeRate) : null,
                        status: PaymentProcessingStatus.INIT,
                        rawPayload: result.metadata || {},
                    },
                });

                // 2. Create transaction record (Audit log/History)
                await tx.paymentTransaction.create({
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
                // 1. Find or create Payment record (Database-level idempotency check)
                let payment = await tx.payment.findUnique({
                    where: { providerTransactionId: verifiedData.transactionId as string },
                    include: { order: true },
                });

                // If payment record doesn't exist (IPN came before createPayment finished), create it
                if (!payment) {
                    this.logger.warn(`Payment ${verifiedData.transactionId} not found in DB during callback. Creating as INIT.`);
                    payment = await tx.payment.create({
                        data: {
                            orderId: verifiedData.orderId as string,
                            provider: paymentMethod as unknown as PaymentGatewayProvider,
                            providerTransactionId: verifiedData.transactionId as string,
                            amount: verifiedData.amount,
                            status: PaymentProcessingStatus.INIT,
                            rawPayload: verifiedData.gatewayResponse || {},
                        },
                        include: { order: true },
                    });
                }

                const order = payment.order;

                // 2. Check for amount mismatch (Security)
                // Use a small epsilon for floating point comparison if necessary, but here we expect VND/exact amounts
                if (Math.abs(Number(payment.amount) - verifiedData.amount) > 0.01) {
                    this.logger.error(
                        `Amount mismatch for payment ${payment.id}. Expected: ${payment.amount}, Received: ${verifiedData.amount}. Potential fraud!`,
                    );
                    throw new BadRequestException('Amount mismatch detected. Potential fraud.');
                }

                // 3. Validate state transition using State Machine
                const nextPaymentProcessingStatus = verifiedData.status === TransactionStatus.SUCCESS 
                    ? PaymentProcessingStatus.SUCCESS 
                    : PaymentProcessingStatus.FAILED;

                this.stateMachine.validateTransition(payment.id, payment.status, nextPaymentProcessingStatus);

                // 3. Update Payment record (Source of Truth)
                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: nextPaymentProcessingStatus,
                        rawPayload: verifiedData.gatewayResponse,
                        captureId: verifiedData.gatewayResponse?.captureId || null,
                        verifiedAt: new Date(),
                    },
                });

                // 4. Update existing PaymentTransaction for history
                const transaction = await tx.paymentTransaction.findFirst({
                    where: { transactionCode: verifiedData.transactionId as string },
                });

                if (transaction) {
                    await tx.paymentTransaction.update({
                        where: { id: transaction.id },
                        data: {
                            status: verifiedData.status,
                            gatewayResponse: verifiedData.gatewayResponse,
                        },
                    });
                }

                // 5. Update order status based on payment result
                if (nextPaymentProcessingStatus === PaymentProcessingStatus.SUCCESS) {
                    // Check if order already paid to avoid double processing (Idempotency)
                    if (order.paymentStatus === 'paid') {
                        this.logger.warn(`Order ${order.id} already marked as paid, skipping inventory deduction.`);
                        return;
                    }

                    await tx.order.update({
                        where: { id: order.id },
                        data: {
                            paymentStatus: PaymentStatusEnum.paid,
                            status: OrderStatusEnum.confirmed,
                            confirmedAt: new Date(),
                            retryCount: 0, 
                        } as any,
                    });

                    // 6. Deduct inventory (Confirming the reservation)
                    await this.inventoryService.deduct(order.id, tx);

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
                        await this.inventoryService.release(order.id, tx);
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
     * Synchronize payment status with gateway
     * Used by reconciliation service to check status of stale payments
     */
    async syncPaymentStatus(paymentId: string): Promise<boolean> {
        this.logger.log(`Synchronizing status for payment ${paymentId}`);

        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { order: true },
        });

        if (!payment || payment.status !== PaymentProcessingStatus.INIT) {
            return false;
        }

        const provider = this.getProvider(payment.provider as unknown as PaymentMethodEnum);
        const verifiedData = await provider.queryTransaction(
            payment.providerTransactionId,
            payment.rawPayload as Record<string, any>,
        );

        if (!verifiedData) {
            return false;
        }

        // If status is still PENDING/INIT, do nothing
        if (verifiedData.status === TransactionStatus.PENDING) {
            return false;
        }

        // Process the result as if it were a callback
        // We can reuse processCallback logic by creating a mock callback or extracting the core logic
        // For simplicity and safety, we'll manually trigger the update logic here or refactor processCallback
        
        if (verifiedData.status === TransactionStatus.SUCCESS) {
            this.logger.log(`Payment ${paymentId} confirmed via QueryDR. Processing success.`);
            
            // Re-use logic for success (this should ideally be refactored into a shared method)
            await this.prisma.$transaction(async (tx) => {
                // Double check status inside transaction
                const p = await tx.payment.findUnique({ where: { id: paymentId } });
                if (!p || p.status !== PaymentProcessingStatus.INIT) return;

                // Update payment
                await tx.payment.update({
                    where: { id: paymentId },
                    data: {
                        status: PaymentProcessingStatus.SUCCESS,
                        rawPayload: verifiedData.gatewayResponse,
                        verifiedAt: new Date(),
                    },
                });

                // Update order
                await tx.order.update({
                    where: { id: payment.orderId },
                    data: {
                        paymentStatus: PaymentStatusEnum.paid,
                        status: OrderStatusEnum.confirmed,
                        confirmedAt: new Date(),
                    } as any,
                });

                // Deduct inventory
                await this.inventoryService.deduct(payment.orderId, tx);

                // Add timeline
                await tx.orderTimeline.create({
                    data: {
                        orderId: payment.orderId,
                        action: 'PAYMENT_CONFIRMED',
                        toStatus: 'confirmed',
                        description: `Payment confirmed via reconciliation query (${payment.provider}).`,
                        actorType: 'system',
                        metadata: { transactionId: payment.providerTransactionId },
                    },
                });
            });
            return true;
        } else if (verifiedData.status === TransactionStatus.FAILED) {
            this.logger.log(`Payment ${paymentId} failed via QueryDR. Processing failure.`);
            await this.prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: PaymentProcessingStatus.FAILED,
                    rawPayload: verifiedData.gatewayResponse,
                },
            });
            return true;
        }

        return false;
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
            return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

                // Find successful payment record (Source of Truth)
                const payment = await tx.payment.findFirst({
                    where: { orderId, status: PaymentProcessingStatus.SUCCESS },
                });

                if (!payment) {
                    throw new BadRequestException('No successful payment record found for order');
                }

                // Find successful payment transaction (for provider details)
                const paymentTransaction = order.transactions.find(
                    (t) => t.status === TransactionStatusEnum.success && t.type === TransactionTypeEnum.payment,
                );

                if (!paymentTransaction) {
                    throw new BadRequestException('No successful payment transaction found for order');
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

                // Update Payment record status
                this.stateMachine.validateTransition(payment.id, payment.status, PaymentProcessingStatus.REFUNDED);
                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: PaymentProcessingStatus.REFUNDED,
                        rawPayload: {
                            ...(payment.rawPayload as object),
                            refund: refundResult.metadata,
                        },
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

            // Find pending VIETQR Payment record
            const vietqrPayment = await tx.payment.findFirst({
                where: { orderId, provider: PaymentGatewayProvider.VIETQR, status: PaymentProcessingStatus.INIT },
            });

            if (!vietqrPayment) {
                throw new BadRequestException('No pending VIETQR payment found');
            }

            // Validate transition
            this.stateMachine.validateTransition(vietqrPayment.id, vietqrPayment.status, PaymentProcessingStatus.SUCCESS);

            // Update Payment
            await tx.payment.update({
                where: { id: vietqrPayment.id },
                data: {
                    status: PaymentProcessingStatus.SUCCESS,
                    verifiedAt: new Date(),
                    rawPayload: {
                        confirmedBy,
                        confirmedAt: new Date().toISOString(),
                        note,
                    },
                },
            });

            // Find pending VIETQR transaction (Audit log)
            const vietqrTransaction = order.transactions.find(
                (t) => t.provider === PaymentMethodEnum.VIETQR && t.status === TransactionStatusEnum.pending,
            );

            if (vietqrTransaction) {
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
            }

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
     * Supports lookup by Order ID or Provider Transaction ID (e.g. PayPal Token)
     */
    async getPaymentProcessingStatus(orderIdOrToken: string) {
        // 1. Try to find by Order ID
        let order = await this.prisma.order.findUnique({
            where: { id: orderIdOrToken },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        // 2. If not found, try to find by Payment Provider Transaction ID (e.g. PayPal Token)
        if (!order) {
            const payment = await this.prisma.payment.findUnique({
                where: { providerTransactionId: orderIdOrToken },
                include: {
                    order: {
                        include: {
                            transactions: {
                                orderBy: { createdAt: 'desc' },
                            },
                        },
                    },
                },
            });

            if (payment) {
                order = payment.order as any;
            }
        }

        if (!order) {
            throw new NotFoundException(`Order or Payment Token ${orderIdOrToken} not found`);
        }

        return {
            orderId: order.id,
            orderCode: order.code,
            paymentStatus: order.paymentStatus,
            status: order.status,
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
    public getProvider(method: PaymentMethodEnum): IPaymentGatewayProvider {
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

        // Get frontend URL and ensure no trailing slash for clean concatenation
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:8080').replace(/\/$/, '');
        
        const metadata = {
            orderId,
            orderCode,
            returnUrl: returnUrl || `${frontendUrl}/payment-result`,
            cancelUrl: cancelUrl || `${frontendUrl}/payment-result?status=failed`,
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
