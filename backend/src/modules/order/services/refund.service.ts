import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatusEnum } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentService } from '../../payment/payment.service';
import { OrderService } from '../order.service';

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly orderService: OrderService,
  ) { }

  /**
   * Financial-Grade Refund Initiation
   * 1. Create stateful PENDING Refund record
   * 2. Call Payment Gateway
   * 3. Sync success/fail status
   */
  async processRefund(orderId: string, amount: number, reason: string, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch Order and check for active successful payments
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { payments: { where: { status: 'SUCCESS' }, include: { transactions: true } } },
      });

      if (!order) throw new NotFoundException('Order not found');

      // Calculate max refundable: sum transaction amounts from successful payments
      const totalPaid = order.payments.reduce(
        (acc, p) => acc + p.transactions.reduce((s, t) => s + Number(t.amount), 0), 0
      );
      const totalRefundedRecords = await (tx as any).refund.findMany({
        where: { orderId, status: 'SUCCESS' as any },
      });
      const alreadyRefunded = totalRefundedRecords.reduce(
        (acc, r: any) => acc + Number(r.amount),
        0,
      );

      if (alreadyRefunded + amount > totalPaid) {
        throw new BadRequestException(
          `Amount ${amount} exceeds remaining refundable balance of ${totalPaid - alreadyRefunded}`,
        );
      }

      // 2. Create local Refund record (PENDING)
      const refund = await (tx as any).refund.create({
        data: {
          orderId,
          amount,
          reason,
          status: 'PENDING' as any,
          metadata: { actorId, initiatedAt: new Date() } as any,
        },
      });

      try {
        // 3. Call Payment System
        // We use the first successful payment found for this order as a target (simplification for MVP, can be expanded to multi-payment)
        const targetPayment = order.payments[0];
        if (!targetPayment) throw new BadRequestException('No successful payment found to refund');

        const result = await this.paymentService.processRefund(
          orderId,
          amount,
          reason,
          true, // restoreInventory
          tx, // Pass transaction client for atomicity
        );

        // 4. Update Refund Record on Immediate Success
        const updatedRefund = await (tx as any).refund.update({
          where: { id: refund.id },
          data: {
            status: result.success ? ('SUCCESS' as any) : ('FAILED' as any),
            externalTransactionId: result.refundTransactionId,
            metadata: { ...result.metadata, processedAt: new Date() } as any,
          },
        });

        // 5. Finalize Order State if fully refunded
        if (updatedRefund.status === ('SUCCESS' as any)) {
          const totalAfterThis = alreadyRefunded + amount;
          if (totalAfterThis >= Number(order.totalAmount)) {
            await this.orderService.transitionTo(
              orderId,
              OrderStatusEnum.REFUNDED,
              'Full refund completed',
              actorId,
              tx,
            );
          }
        }

        return updatedRefund;
      } catch (error) {
        this.logger.error(`Refund processing failed for ${refund.id}: ${error.message}`);
        await (tx as any).refund.update({
          where: { id: refund.id },
          data: { status: 'FAILED' as any, reason: error.message },
        });
        throw error;
      }
    });
  }
}
