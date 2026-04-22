import { SystemAction } from '@common/decorators/system-action.decorator';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { InventoryService } from '../../inventory/inventory.service';

/**
 * Cleanup Expired Reservations Job
 */
@Injectable()
export class CleanupExpiredReservationsJob {
  private readonly logger = new Logger(CleanupExpiredReservationsJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Cron job: Runs every minute
   *
   * SE L8 Pattern: Use systemic @SystemAction decorator to authorize
   * background mutations while maintaining strict audit boundaries.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  @SystemAction()
  async handleCron() {
    const now = new Date();
    try {
      const expiredOrders = await this.prisma.order.findMany({
        where: {
          status: 'pending_payment',
          paymentDeadline: { lt: now },
        },
        include: { items: true },
      });

      if (expiredOrders.length === 0) return;

      this.logger.log(`[SYSTEM_CLEANUP] Found ${expiredOrders.length} expired orders.`);

      for (const order of expiredOrders) {
        try {
          await this.cancelExpiredOrder(order);
        } catch (error) {
          this.logger.error(`Failed to cancel order ${order.code}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Cleanup handleCron failed: ${error.message}`);
    }
  }

  private async cancelExpiredOrder(order: any): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Release inventory
      await this.inventoryService.release(order.id, tx);

      // 2. Update order
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'cancelled',
          paymentStatus: 'unpaid',
          cancelReason: 'Payment timeout (15 minutes expired)',
          cancelledAt: new Date(),
        },
      });

      // 3. Update transactions
      await tx.paymentTransaction.updateMany({
        where: { orderId: order.id },
        data: { status: 'failed' },
      });

      // 4. Trace in timeline
      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          action: 'order_cancelled',
          fromStatus: 'pending_payment',
          toStatus: 'cancelled',
          description: 'System automatically cancelled order due to payment timeout',
          actorType: 'system',
        },
      });

      this.logger.log(`Cancelled expired order ${order.code}`);
    });
  }
}
