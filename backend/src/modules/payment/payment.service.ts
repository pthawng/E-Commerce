import { SystemContextStore } from '@common/context/system-context.store';
import { PaginationService } from '@common/pagination';
import { Principal } from '@common/types/principal.types';
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ActionType,
  OrderStatusEnum,
  PaymentGatewayProvider,
  PaymentMethodEnum,
  PaymentProcessingStatus,
  PaymentStatusEnum,
  Prisma,
  TransactionStatusEnum,
  TransactionTypeEnum,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { LedgerIntegrationService } from '../ledger/ledger-integration.service';
import { OrderPaymentService } from '../order/services/order-payment.service';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { PayPalProvider } from './providers/paypal/paypal.provider';
import { VietQRProvider } from './providers/vietqr/vietqr.provider';
import { VNPayProvider } from './providers/vnpay/vnpay.provider';
import { IdempotencyService } from './services/idempotency.service';
import { PaymentStateMachine } from './services/payment-state.machine';
import { WebhookIdempotencyService } from './services/webhook-idempotency.service';
import {
  CallbackData,
  IPaymentGatewayProvider,
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
    private readonly webhookIdempotency: WebhookIdempotencyService,
    private readonly stateMachine: PaymentStateMachine,
    private readonly inventoryService: InventoryService,
    private readonly paginationService: PaginationService,
    private readonly ledgerIntegration: LedgerIntegrationService,
    @Inject(forwardRef(() => OrderPaymentService))
    private readonly orderPaymentService: OrderPaymentService,
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
    principal?: Principal,
    metadata?: Record<string, any>,
  ): Promise<PaymentResult> {
    return SystemContextStore.asInternal('PaymentService', async () => {
      // Generate idempotency key
      const idempotencyKey = this.idempotencyService.generatePaymentKey(orderId, 'create');

      // Check for cached result
      const cachedResult = await this.idempotencyService.getResult(idempotencyKey);
      if (cachedResult) {
        this.logger.log(`Returning cached payment result for order ${orderId}`);
        return cachedResult;
      }

      // Acquire distributed lock
      const lockToken = await this.idempotencyService.acquireLock(idempotencyKey);
      if (!lockToken) {
        throw new ConflictException('Payment creation already in progress. Please wait.');
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

        // Verify ownership before initiating any payment action.
        if (principal) {
          const isOwner =
            (principal.type === 'USER' && order.userId === principal.id) ||
            (principal.type === 'GUEST' && order.sessionId === principal.id) ||
            (principal.type === 'ORDER_ACCESS' && order.id === principal.id);

          if (!isOwner) {
            throw new BadRequestException('Access Denied: You do not own this order.');
          }
        }

        // Check if order already has a successful payment
        const hasSuccessfulPayment = order.transactions.some(
          (tx) =>
            tx.status === TransactionStatusEnum.success && tx.type === TransactionTypeEnum.payment,
        );

        if (hasSuccessfulPayment) {
          throw new BadRequestException('Order already paid');
        }

        // Get provider
        const provider = this.getProvider(paymentMethod);

        // Create payment - Pass frozen rate and currency from Order for financial integrity
        const result = await provider.createPayment(orderId, Number(order.totalAmount), {
          ...metadata,
          exchangeRate: (order as any).exchangeRate,
          displayCurrency: (order as any).displayCurrency,
        });

        // 1. Create Payment record (Source of Truth - Aggregate Head)
        await this.prisma.$transaction(async (tx) => {
          const payment = await tx.payment.create({
            data: {
              orderId,
              status: PaymentProcessingStatus.INIT,
            },
          });

          // 2. Create transaction record (Attempt Detail)
          await tx.paymentTransaction.create({
            data: {
              orderId,
              paymentId: payment.id,
              amount: order.totalAmount,
              type: TransactionTypeEnum.payment,
              status: TransactionStatusEnum.pending,
              provider: paymentMethod,
              method: paymentMethod,
              transactionCode: result.transactionId,
              providerTransactionId: result.transactionId,
              amountUsd: result.metadata?.amountUsd
                ? new Prisma.Decimal(result.metadata.amountUsd)
                : null,
              exchangeRate: result.metadata?.exchangeRate
                ? new Prisma.Decimal(result.metadata.exchangeRate)
                : null,
              gatewayResponse: result.metadata || {},
              rawPayload: result.metadata || {},
            },
          });
        });

        this.logger.log(
          `Payment created for order ${orderId}, method: ${paymentMethod}, transaction: ${result.transactionId}`,
        );
        await this.idempotencyService.storeResult(idempotencyKey, result);
        return result;
      } finally {
        await this.idempotencyService.releaseLock(idempotencyKey, lockToken);
      }
    });
  }

  /**
   * Process payment callback from gateway (with idempotency)
   */
  async processCallback(
    paymentMethod: PaymentMethodEnum,
    callbackData: Record<string, any>,
  ): Promise<CallbackData> {
    return SystemContextStore.asInternal('PaymentService', async () => {
      this.logger.log(`Processing callback for ${paymentMethod}`);
      const provider = this.getProvider(paymentMethod);

      // Verify callback first (to get transaction ID)
      const verifiedData = await provider.verifyCallback(callbackData);

      // Generate unified execution lock key using transaction ID
      // This key is shared by Webhook and Redirect flows for this specific transaction
      const executionKey = `payment_execution:${verifiedData.transactionId}`;

      // 1. Check if already processed (Distributed Cache Idempotency)
      const cachedResult = await this.idempotencyService.getResult(executionKey);
      if (cachedResult) {
        this.logger.log(`Transaction ${verifiedData.transactionId} already processed (CACHED).`);
        return cachedResult;
      }

      // 2. Hard Persistent Idempotency (DB-level Source of Truth)
      const isNew = await this.webhookIdempotency.startProcessing(
        paymentMethod,
        verifiedData.transactionId,
        callbackData,
      );
      if (!isNew) {
        this.logger.warn(
          `Webhook ${verifiedData.transactionId} already processed or processing (DB).`,
        );
        return verifiedData;
      }

      // 3. Acquire Distributed Lock for atomic execution
      const lockToken = await this.idempotencyService.acquireLock(executionKey);
      if (!lockToken) {
        this.logger.warn(
          `Concurrent execution detected for transaction ${verifiedData.transactionId}`,
        );
        // If we can't get the lock, we must fail the idempotency record so it can be retried
        await this.webhookIdempotency.fail(
          paymentMethod,
          verifiedData.transactionId,
          'Concurrent lock timeout',
        );
        throw new ConflictException('Payment processing in progress. Please retry.');
      }

      try {
        await this.prisma.$transaction(async (tx) => {
          // 1. Handle Refund Reconciliation (New Stateful Flow)
          if (verifiedData.transactionType === 'refund') {
            const refund = await (tx as any).refund.findFirst({
              where: {
                OR: [
                  { externalTransactionId: verifiedData.transactionId },
                  { id: verifiedData.gatewayResponse?.internalRefundId as string }, // Fallback to metadata
                ],
              },
            });

            if (refund) {
              const nextRefundStatus =
                verifiedData.status === TransactionStatus.SUCCESS
                  ? ('SUCCESS' as any)
                  : ('FAILED' as any);

              await (tx as any).refund.update({
                where: { id: refund.id },
                data: {
                  status: nextRefundStatus,
                  externalTransactionId: verifiedData.transactionId,
                  metadata: {
                    ...((refund.metadata as object) || {}),
                    webhook: verifiedData.gatewayResponse,
                  } as any,
                },
              });

              if (nextRefundStatus === ('SUCCESS' as any)) {
                await tx.orderTimeline.create({
                  data: {
                    orderId: refund.orderId,
                    action: 'REFUND_RECONCILED',
                    description: `Refund ${refund.id} confirmed via ${paymentMethod} webhook.`,
                    actorType: 'system',
                  },
                });
              }

              return verifiedData;
            }
          }

          // 2. Find internal transaction record
          const transaction = await tx.paymentTransaction.findFirst({
            where: { providerTransactionId: verifiedData.transactionId },
            include: { payment: true },
          });

          if (!transaction || !transaction.payment) {
            this.logger.error(
              `Transaction/Payment ${verifiedData.transactionId} not found in DB during callback.`,
            );
            throw new NotFoundException(
              `Payment not found for transaction ${verifiedData.transactionId}`,
            );
          }

          const payment = transaction.payment;

          // 2. Security: Amount mismatch check
          if (this.hasAmountMismatch(paymentMethod, transaction, verifiedData)) {
            this.logger.error(`Amount mismatch for payment ${payment.id}. Fraud suspected!`);
            throw new BadRequestException('Amount mismatch detected.');
          }

          // 3. State Machine check using current payment status
          const nextStatus =
            verifiedData.status === TransactionStatus.SUCCESS
              ? PaymentProcessingStatus.SUCCESS
              : PaymentProcessingStatus.FAILED;

          this.stateMachine.validateTransition(payment.id, payment.status, nextStatus);

          if (
            payment.status === PaymentProcessingStatus.SUCCESS ||
            payment.status === PaymentProcessingStatus.FAILED
          ) {
            this.logger.log(
              `Payment ${payment.id} already in terminal state: ${payment.status}. Returning current data.`,
            );

            return {
              orderId: payment.orderId,
              transactionId: transaction.providerTransactionId!,
              amount: Number(transaction.amount),
              status:
                payment.status === PaymentProcessingStatus.SUCCESS
                  ? TransactionStatus.SUCCESS
                  : TransactionStatus.FAILED,
              paymentMethod,
              gatewayResponse: transaction.gatewayResponse,
            };
          }

          // 4. Update PaymentTransaction
          await tx.paymentTransaction.update({
            where: { id: transaction.id },
            data: {
              status:
                verifiedData.status === TransactionStatus.SUCCESS
                  ? TransactionStatusEnum.success
                  : TransactionStatusEnum.failed,
              gatewayResponse: verifiedData.gatewayResponse,
              rawPayload: verifiedData.gatewayResponse,
              captureId: verifiedData.gatewayResponse?.captureId || null,
            },
          });

          // 5. Update Payment record (Derived Status)
          // Refetch transactions to compute aggregate status
          const allTs = await tx.paymentTransaction.findMany({
            where: { paymentId: payment.id },
          });
          const transactionStatuses = allTs.map((t) => t.status);

          // Use our new derivation logic (Fix 3 Requirement)
          const { derivePaymentStatus } = await import('./payment-status.derive');
          const finalPaymentStatus = derivePaymentStatus(transactionStatuses);

          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: finalPaymentStatus,
              verifiedAt:
                finalPaymentStatus === PaymentProcessingStatus.SUCCESS ? new Date() : undefined,
            },
          });

          const order = await tx.order.findUnique({ where: { id: payment.orderId } });
          if (!order) {
            this.logger.error(`Order ${payment.orderId} not found for payment ${payment.id}`);
            throw new NotFoundException(`Order not found`);
          }

          // 6. Handle SUCCESS flow
          if (finalPaymentStatus === PaymentProcessingStatus.SUCCESS) {
            // Standard Confirmation Flow (Consolidated)
            await this.orderPaymentService.confirmOrder(payment.orderId, tx);

            // Atomic ledger entry is written in the same payment confirmation transaction.
            await this.ledgerIntegration.recordOrderPayment(
              payment.orderId,
              Number(transaction.amount),
              tx,
            );

            await tx.orderTimeline.create({
              data: {
                orderId: payment.orderId,
                action: 'PAYMENT_SUCCESS_WEBHOOK',
                description: `Payment confirmed via ${paymentMethod} webhook. Order confirmed and inventory deducted.`,
                actorType: 'system',
                metadata: { transactionId: verifiedData.transactionId },
              },
            });
          } else {
            // 7. Handle FAILURE flow
            const isMaxRetries = (order as any).retryCount >= 5;
            const finalOrderStatus = isMaxRetries
              ? OrderStatusEnum.CANCELLED
              : OrderStatusEnum.PENDING_PAYMENT;

            await tx.order.update({
              where: { id: payment.orderId },
              data: {
                status: finalOrderStatus,
                retryCount: { increment: 1 },
                version: { increment: 1 },
              } as any,
            });

            if (isMaxRetries) {
              await this.inventoryService.release(payment.orderId, tx);
            }

            await tx.orderTimeline.create({
              data: {
                orderId: payment.orderId,
                action: 'PAYMENT_FAILED_WEBHOOK',
                description: `Payment failed via ${paymentMethod} webhook. Status: ${finalOrderStatus}`,
                actorType: 'system',
                metadata: { transactionId: verifiedData.transactionId },
              },
            });
          }
        });

        this.logger.log(
          `Payment processed: Order=${verifiedData.orderId}, Status=${verifiedData.status}`,
        );
        await this.idempotencyService.storeResult(executionKey, verifiedData);
        await this.webhookIdempotency.complete(paymentMethod, verifiedData.transactionId);
        return verifiedData;
      } catch (error) {
        await this.webhookIdempotency.fail(
          paymentMethod,
          verifiedData.transactionId,
          error.message,
        );
        throw error;
      } finally {
        await this.idempotencyService.releaseLock(executionKey, lockToken);
      }
    });
  }

  async syncPaymentStatus(paymentId: string): Promise<boolean> {
    return SystemContextStore.asInternal('PaymentService', async () => {
      this.logger.log(`Synchronizing status for payment ${paymentId}`);

      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          order: true,
          transactions: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });

      if (!payment || payment.status !== PaymentProcessingStatus.INIT) {
        return false;
      }

      const lastTx = payment.transactions[0];
      if (!lastTx) return false;

      const provider = this.getProvider(lastTx.provider as unknown as PaymentMethodEnum);
      let verifiedData;
      try {
        verifiedData = await provider.queryTransaction(
          lastTx.providerTransactionId!,
          lastTx.rawPayload as Record<string, any>,
        );
      } catch (error) {
        this.logger.error(`Sync failed for payment ${paymentId}: ${error.message}`);

        // Mark as FAILED if synchronization failed due to provider error (e.g. account locked)
        await this.prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: PaymentProcessingStatus.FAILED,
              errorLog: error.message,
            },
          });

          await tx.orderTimeline.create({
            data: {
              orderId: payment.orderId,
              action: 'PAYMENT_SYNC_FAILED',
              toStatus: OrderStatusEnum.PENDING_PAYMENT,
              description: `Sync with ${lastTx.provider} failed: ${error.message}`,
              actorType: 'system',
            },
          });
        });
        return true; // Return true as we successfully "synced" the failure state
      }

      if (!verifiedData) {
        return false;
      }

      // If status is still PENDING/INIT, do nothing
      if (verifiedData.status === TransactionStatus.PENDING) {
        return false;
      }

      // Process the result as if it were a callback
      if (verifiedData.status === TransactionStatus.SUCCESS) {
        this.logger.log(`Payment ${paymentId} confirmed via QueryDR. Processing success.`);

        await this.prisma.$transaction(async (tx) => {
          // 1. Update the Transaction
          await tx.paymentTransaction.update({
            where: { id: lastTx.id },
            data: {
              status:
                verifiedData.status === TransactionStatus.SUCCESS
                  ? TransactionStatusEnum.success
                  : TransactionStatusEnum.failed,
              gatewayResponse: verifiedData.gatewayResponse,
            },
          });

          // 2. Refetch all transactions and derive status
          const allTs = await tx.paymentTransaction.findMany({ where: { paymentId } });
          const { derivePaymentStatus } = await import('./payment-status.derive');
          const finalStatus = derivePaymentStatus(allTs.map((t) => t.status));

          await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: finalStatus,
              verifiedAt: finalStatus === PaymentProcessingStatus.SUCCESS ? new Date() : undefined,
            },
          });

          if (finalStatus === PaymentProcessingStatus.SUCCESS) {
            await this.orderPaymentService.confirmOrder(payment.orderId, tx);
            // ... timeline entries
          }
        });
        return true;
      }
      return false;
    });
  }

  /**
   * Process refund for an order (with idempotency)
   */
  async processRefund(
    orderId: string,
    amount: number,
    reason?: string,
    restoreInventory: boolean = true,
    txClient?: Prisma.TransactionClient,
  ): Promise<RefundResult> {
    return SystemContextStore.asInternal('PaymentService', async () => {
      const idempotencyKey = this.idempotencyService.generatePaymentKey(orderId, 'refund');
      const cachedResult = await this.idempotencyService.getResult(idempotencyKey);
      if (cachedResult) return cachedResult;

      const lockToken = await this.idempotencyService.acquireLock(idempotencyKey);
      if (!lockToken) throw new ConflictException('Refund already in progress. Please wait.');

      try {
        const execute = async (tx: Prisma.TransactionClient) => {
          const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { transactions: true, items: true },
          });

          if (!order) throw new NotFoundException(`Order ${orderId} not found`);

          const existingRefund = order.transactions.find(
            (t) =>
              t.type === TransactionTypeEnum.refund && t.status === TransactionStatusEnum.success,
          );
          if (existingRefund) throw new BadRequestException('Order already refunded');

          const payment = await tx.payment.findFirst({
            where: { orderId, status: PaymentProcessingStatus.SUCCESS },
          });
          if (!payment)
            throw new BadRequestException('No successful payment record found for order');

          const paymentTransaction = order.transactions.find(
            (t) =>
              t.status === TransactionStatusEnum.success && t.type === TransactionTypeEnum.payment,
          );
          if (!paymentTransaction)
            throw new BadRequestException('No successful payment transaction found for order');

          if (amount > Number(order.totalAmount))
            throw new BadRequestException('Refund amount cannot exceed order total');

          const provider = this.getProvider(paymentTransaction.provider as PaymentMethodEnum);
          const refundResult = await provider.processRefund(
            paymentTransaction.transactionCode || '',
            amount,
            reason,
          );

          await tx.paymentTransaction.create({
            data: {
              orderId,
              amount,
              type: TransactionTypeEnum.refund,
              status: refundResult.success
                ? TransactionStatusEnum.success
                : TransactionStatusEnum.failed,
              provider: paymentTransaction.provider,
              method: paymentTransaction.method,
              transactionCode: refundResult.refundTransactionId,
              gatewayResponse: refundResult.metadata || {},
              note: reason,
            },
          });

          this.stateMachine.validateTransition(
            payment.id,
            payment.status,
            PaymentProcessingStatus.REFUNDED,
          );
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentProcessingStatus.REFUNDED,
              errorLog: JSON.stringify({ refund: refundResult.metadata }),
            },
          });

          await tx.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: PaymentStatusEnum.refunded,
              status: OrderStatusEnum.REFUNDED,
              version: { increment: 1 },
            },
          });

          if (restoreInventory) await this.restoreInventory(tx, order);

          await tx.orderTimeline.create({
            data: {
              orderId,
              action: 'REFUND_PROCESSED',
              toStatus: OrderStatusEnum.REFUNDED,
              description: `Refund processed: ${amount} VND. Reason: ${reason || 'N/A'}`,
              actorType: 'system',
              metadata: { refundTransactionId: refundResult.refundTransactionId, amount, reason },
            },
          });

          await this.idempotencyService.storeResult(idempotencyKey, refundResult);
          return refundResult;
        };

        return txClient ? execute(txClient) : this.prisma.$transaction(execute);
      } finally {
        await this.idempotencyService.releaseLock(idempotencyKey, lockToken);
      }
    });
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
    return SystemContextStore.asInternal('PaymentService', async () => {
      await this.prisma.$transaction(async (tx) => {
        const [lockedOrder] = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id
          FROM "Order"
          WHERE id = ${orderId}
          FOR UPDATE
        `;

        if (!lockedOrder) {
          throw new NotFoundException(`Order ${orderId} not found`);
        }

        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { transactions: true },
        });

        if (!order) throw new NotFoundException(`Order ${orderId} not found`);

        if (
          order.paymentStatus === PaymentStatusEnum.paid ||
          order.status === OrderStatusEnum.CONFIRMED
        ) {
          this.logger.log(`VietQR order ${orderId} already confirmed. Skipping.`);
          return;
        }

        if (Math.abs(Number(order.totalAmount) - amount) > 0.01) {
          throw new BadRequestException('Amount mismatch detected.');
        }

        const vietqrPayment = await tx.payment.findFirst({
          where: {
            orderId,
            status: PaymentProcessingStatus.INIT,
            transactions: { some: { provider: 'VIETQR' } },
          },
          include: { transactions: true },
        });

        if (!vietqrPayment) throw new BadRequestException('No pending VIETQR payment found');

        this.stateMachine.validateTransition(
          vietqrPayment.id,
          vietqrPayment.status,
          PaymentProcessingStatus.SUCCESS,
        );

        // 1. Update/Create Transaction
        const lastTx =
          vietqrPayment.transactions.find((t) => t.status === TransactionStatusEnum.pending) ||
          vietqrPayment.transactions[0];

        if (lastTx) {
          await tx.paymentTransaction.update({
            where: { id: lastTx.id },
            data: {
              status: TransactionStatusEnum.success,
              gatewayResponse: { confirmedBy, confirmedAt: new Date().toISOString(), note },
            },
          });
        }

        // 2. Derive and update Payment status
        const allTs = await tx.paymentTransaction.findMany({
          where: { paymentId: vietqrPayment.id },
        });
        const { derivePaymentStatus } = await import('./payment-status.derive');
        const finalStatus = derivePaymentStatus(allTs.map((t) => t.status));

        await tx.payment.update({
          where: { id: vietqrPayment.id },
          data: {
            status: finalStatus,
            verifiedAt: finalStatus === PaymentProcessingStatus.SUCCESS ? new Date() : undefined,
          },
        });

        // 3. Confirm Order via standard service if payment successful
        if (finalStatus === PaymentProcessingStatus.SUCCESS) {
          await this.orderPaymentService.confirmOrder(orderId, tx);
        }

        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: PaymentStatusEnum.paid,
            status: OrderStatusEnum.CONFIRMED,
            confirmedAt: new Date(),
            version: { increment: 1 },
          },
        });

        // Clear Cart (Only on success)
        const cartWhere = order.userId ? { userId: order.userId } : { sessionId: order.sessionId };
        await tx.cart.deleteMany({ where: cartWhere });

        await tx.orderTimeline.create({
          data: {
            orderId,
            action: 'VIETQR_PAYMENT_CONFIRMED',
            toStatus: OrderStatusEnum.CONFIRMED,
            description: `VietQR payment confirmed by staff`,
            actorId: confirmedBy,
            actorType: 'staff',
            metadata: { amount, note },
          },
        });
      });

      this.logger.log(`VietQR payment confirmed for order ${orderId}`);
    });
  }

  /**
   * Get payment status for an order
   * Supports lookup by Order ID or Provider Transaction ID (e.g. PayPal Token)
   */
  async getPaymentProcessingStatus(orderIdOrToken: string, principal?: Principal) {
    let order: any = null;

    const isUuid =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        orderIdOrToken,
      );

    if (isUuid) {
      order = await this.prisma.order.findUnique({
        where: { id: orderIdOrToken },
        include: { transactions: { orderBy: { createdAt: 'desc' } } },
      });
    }

    if (!order) {
      const txRecord = await this.prisma.paymentTransaction.findUnique({
        where: { providerTransactionId: orderIdOrToken },
        include: { order: { include: { transactions: { orderBy: { createdAt: 'desc' } } } } },
      });
      if (txRecord) order = txRecord.order as any;
    }

    if (!order) throw new NotFoundException(`Order or Payment Token ${orderIdOrToken} not found`);

    // Verify ownership before returning status.
    if (principal) {
      const isOwner =
        (principal.type === 'USER' && order.userId === principal.id) ||
        (principal.type === 'GUEST' && order.sessionId === principal.id) ||
        (principal.type === 'ORDER_ACCESS' && order.id === principal.id);

      if (!isOwner) {
        throw new BadRequestException('Access Denied: You do not own this order.');
      }
    }

    if (order.status === OrderStatusEnum.PENDING_PAYMENT || order.paymentStatus === 'unpaid') {
      const pendingPayment = await this.prisma.payment.findFirst({
        where: { orderId: order.id, status: 'INIT' },
      });

      if (pendingPayment) {
        this.logger.log(`Proactively syncing payment status for order ${order.id}`);
        const isSynced = await this.syncPaymentStatus(pendingPayment.id);
        if (isSynced) {
          order = await this.prisma.order.findUnique({
            where: { id: order.id },
            include: { transactions: { orderBy: { createdAt: 'desc' } } },
          });
        }
      }
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
      this.logger.warn(
        `No inventory deduction logs found for order ${order.id}. Skipping restoration.`,
      );
      return;
    }

    for (const log of deductionLogs) {
      const quantityToRestore = Math.abs(log.quantityChange);

      // Fetch current inventory item to get accurate beforeQuantity for logging
      const inventoryItem = await tx.inventoryItem.findUnique({
        where: { id: log.inventoryItemId },
      });

      if (!inventoryItem) {
        this.logger.error(
          `Inventory item ${log.inventoryItemId} not found during restoration for order ${order.id}`,
        );
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

    this.logger.log(
      `Inventory restored for order ${order.id} across ${deductionLogs.length} warehouse locations`,
    );
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

  private hasAmountMismatch(
    paymentMethod: PaymentMethodEnum,
    transaction: {
      amount: Prisma.Decimal | number;
      amountUsd?: Prisma.Decimal | number | null;
      exchangeRate?: Prisma.Decimal | number | null;
    },
    verifiedData: CallbackData,
  ): boolean {
    const verifiedAmount = Number(verifiedData.amount);

    // PayPal reports gateway amounts in USD. Internal order totals remain VND.
    // Some synchronous capture/query paths use amount=0 and rely on the DB transaction as source of truth.
    if (paymentMethod === PaymentMethodEnum.PAYPAL) {
      if (!verifiedAmount) return false;

      const storedUsd = transaction.amountUsd != null ? Number(transaction.amountUsd) : null;
      const rate = transaction.exchangeRate != null ? Number(transaction.exchangeRate) : null;
      const expectedUsd = storedUsd ?? (rate ? Number(transaction.amount) * rate : null);

      if (expectedUsd == null) return false;
      return Math.abs(expectedUsd - verifiedAmount) > 0.01;
    }

    return Math.abs(Number(transaction.amount) - verifiedAmount) > 0.01;
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
    this.logger.log(`Generating payment URL: provider=${provider}, orderId=${orderId}`);

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

      // Use createPayment to ensure record exists before redirect (Source of Truth)
      const result = await this.createPayment(orderId, paymentMethod, undefined, metadata);

      return result.paymentUrl || null;
    } catch (error) {
      this.logger.error(`Failed to generate payment URL for provider ${provider}`, error);
      throw error;
    }
  }
  /**
   * Get PayPal provider for advanced operations
   */
  getPayPalProvider(): PayPalProvider {
    return this.paypalProvider;
  }

  async findTransactions(query: TransactionQueryDto) {
    const { status, provider, orderCode, reconciliationStatus } = query;

    const where: Prisma.PaymentTransactionWhereInput = {};
    if (status) where.status = status as any;
    if (reconciliationStatus) where.reconciliationStatus = reconciliationStatus as any;
    if (provider) where.provider = provider;
    if (orderCode) {
      where.order = {
        code: {
          contains: orderCode,
          mode: 'insensitive',
        },
      };
    }

    return this.paginationService.paginate({
      findMany: (args) => this.prisma.paymentTransaction.findMany(args),
      count: (args) => this.prisma.paymentTransaction.count(args),
      dto: query,
      where,
      allowedSortFields: ['createdAt', 'amount', 'status'],
      defaultSort: { field: 'createdAt', order: 'desc' },
      basePath: '/api/payments/transactions',
      include: {
        order: {
          select: {
            id: true,
            code: true,
          },
        },
      },
    });
  }

  async getTransactionStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [volume, stats, recon] = await Promise.all([
      this.prisma.paymentTransaction.aggregate({
        _sum: { amount: true },
        where: { status: TransactionStatusEnum.success, type: TransactionTypeEnum.payment },
      }),
      this.prisma.paymentTransaction.groupBy({
        by: ['status'],
        _count: { _all: true },
        _sum: { amount: true },
      }),
      this.prisma.paymentTransaction.groupBy({
        by: ['reconciliationStatus'],
        _count: { _all: true },
      }),
    ]);

    const successfulTx = stats.find((s) => s.status === TransactionStatusEnum.success);
    const failedTx = stats.find((s) => s.status === TransactionStatusEnum.failed);
    const pendingTx = stats.find((s) => s.status === TransactionStatusEnum.pending);
    const totalCount = stats.reduce((acc, s) => acc + s._count._all, 0);

    return {
      totalVolume: Number(volume._sum.amount || 0),
      successRate: totalCount > 0 ? (successfulTx?._count._all || 0) / totalCount : 0,
      failedCount: failedTx?._count._all || 0,
      pendingCount: pendingTx?._count._all || 0,
      revenue: Number(successfulTx?._sum.amount || 0),
      reconciliation: {
        mismatchCount:
          recon.find((r) => r.reconciliationStatus === ('MISMATCH' as any))?._count._all || 0,
        unreconciledCount:
          recon.find((r) => r.reconciliationStatus === ('UNVERIFIED' as any))?._count._all || 0,
        matchedAmount: Number(volume._sum.amount || 0), // In production, sum by matched status.
      },
    };
  }

  async getTransactionAnomalies() {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [pendingHighValue, failedSpike, longPending] = await Promise.all([
      this.prisma.paymentTransaction.findMany({
        where: {
          status: TransactionStatusEnum.pending,
          amount: { gte: 50000000 }, // 50M VND
        },
        take: 5,
        orderBy: { amount: 'desc' },
      }),
      this.prisma.paymentTransaction.count({
        where: {
          status: TransactionStatusEnum.failed,
          createdAt: { gte: oneHourAgo },
        },
      }),
      this.prisma.paymentTransaction.count({
        where: {
          status: TransactionStatusEnum.pending,
          createdAt: { lte: thirtyMinsAgo },
        },
      }),
    ]);

    const anomalies: any[] = [];
    if (failedSpike > 10) {
      anomalies.push({ type: 'FAILED_SPIKE', count: failedSpike, severity: 'critical' });
    }
    if (pendingHighValue.length > 0) {
      anomalies.push({
        type: 'HIGH_VALUE_PENDING',
        count: pendingHighValue.length,
        amount: Number(pendingHighValue[0].amount),
        severity: 'high',
      });
    }
    if (longPending > 0) {
      anomalies.push({ type: 'LONG_PENDING', count: longPending, severity: 'medium' });
    }

    return anomalies;
  }

  canRetry(transaction: any): boolean {
    return (
      transaction.status === TransactionStatusEnum.failed &&
      [PaymentGatewayProvider.VNPAY, PaymentGatewayProvider.PAYPAL].includes(
        transaction.provider as any,
      )
    );
  }
}
