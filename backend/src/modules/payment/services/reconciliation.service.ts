import { SystemAction } from '@common/decorators/system-action.decorator';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderStatusEnum, PaymentProcessingStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderService } from '../../order/order.service';
import { PaymentService } from '../payment.service';
import { PaymentStateMachine } from './payment-state.machine';

/**
 * Payment Reconciliation Service
 * Periodically checks for stale or expired payments and cleans them up
 */
@Injectable()
export class PaymentReconciliationService {
  private readonly logger = new Logger(PaymentReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: PaymentStateMachine,
    private readonly paymentService: PaymentService,
    private readonly orderService: OrderService,
  ) { }

  /**
   * Cron job to reconcile stale payments every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async reconcileStalePayments() {
    this.logger.log('Starting stale payment reconciliation job...');

    const timeoutMinutes = 15;
    const expirationThreshold = new Date();
    expirationThreshold.setMinutes(expirationThreshold.getMinutes() - timeoutMinutes);

    try {
      const stalePayments = await this.prisma.payment.findMany({
        where: {
          status: PaymentProcessingStatus.INIT,
          createdAt: { lt: expirationThreshold },
        },
        include: {
          order: true,
        },
      });

      if (stalePayments.length === 0) {
        this.logger.log('No stale payments found.');
        return;
      }

      this.logger.log(`Found ${stalePayments.length} stale payments to reconcile.`);

      for (const payment of stalePayments) {
        await this.reconcilePayment(payment);
      }

      this.logger.log('Payment reconciliation job completed successfully.');
    } catch (error) {
      this.logger.error(`Error during payment reconciliation: ${error.message}`, error.stack);
    }
  }

  /**
   * Reconcile a single stale payment
   *
   * SE L8 Pattern: Wrapping sensitive mutation logic in @SystemAction
   * ensures background reconciliation is authorized while preserving
   * invariant protection for the rest of the app.
   */
  @SystemAction()
  private async reconcilePayment(payment: any) {
    this.logger.log(`Reconciling stale payment ${payment.id} for order ${payment.orderId}`);

    try {
      const isSynced = await this.paymentService.syncPaymentStatus(payment.id);
      if (isSynced) {
        this.logger.log(`Payment ${payment.id} synced with gateway. Skipping cancellation.`);
        return;
      }

      await this.prisma.$transaction(async (tx) => {
        this.stateMachine.validateTransition(
          payment.id,
          payment.status,
          PaymentProcessingStatus.FAILED,
        );

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentProcessingStatus.FAILED,
            errorLog: JSON.stringify({
              reconciliationNote: 'Marked as FAILED due to timeout (15 mins)',
            }),
          },
        });

        const order = payment.order;
        if (order.status === OrderStatusEnum.PENDING_PAYMENT) {
          this.logger.log(`Cancelling unpaid order ${order.id} during reconciliation`);

          await this.orderService.transitionTo(
            order.id,
            OrderStatusEnum.CANCELLED,
            'Order automatically cancelled due to payment timeout (Reconciliation).',
            undefined, // System action
            tx,
          );
        }
      });

      this.logger.log(`Successfully reconciled and cancelled order ${payment.orderId}`);
    } catch (error) {
      this.logger.error(`Failed to reconcile payment ${payment.id}: ${error.message}`);
    }
  }
}
