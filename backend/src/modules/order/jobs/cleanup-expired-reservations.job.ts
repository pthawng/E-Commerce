import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { InventoryService } from '../../inventory/inventory.service';

/**
 * Cleanup Expired Reservations Job
 *
 * Runs every minute to:
 * 1. Find expired pending_payment orders
 * 2. Cancel the orders
 * 3. Release inventory reservations
 *
 * This prevents inventory from being locked indefinitely
 * when users abandon payment
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
   * Query: Find orders where:
   * - status = 'pending_payment'
   * - paymentDeadline < NOW()
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const now = new Date();

    try {
      // Find expired orders
      const expiredOrders = await this.prisma.order.findMany({
        where: {
          status: 'pending_payment',
          paymentDeadline: {
            lt: now,
          },
        },
        include: {
          items: true,
        },
      });

      if (expiredOrders.length === 0) {
        return; // No expired orders
      }

      this.logger.log(`Found ${expiredOrders.length} expired orders to clean up`);

      // Process each expired order
      for (const order of expiredOrders) {
        try {
          await this.cancelExpiredOrder(order);
        } catch (error) {
          this.logger.error(`Failed to cancel expired order ${order.code}`, error);
          // Continue with other orders
        }
      }

      this.logger.log(`Cleanup completed: ${expiredOrders.length} orders processed`);
    } catch (error) {
      this.logger.error('Cleanup job failed', error);
    }
  }

  /**
   * Cancel a single expired order
   * Releases inventory and updates order status
   */
  private async cancelExpiredOrder(order: any): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Release inventory reservations
      await this.inventoryService.release(order.id, tx);

      // 2. Update order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'cancelled',
          paymentStatus: 'unpaid',
          cancelReason: 'Payment timeout (15 minutes expired)',
          cancelledAt: new Date(),
        },
      });

      // 3. Update payment transaction
      await tx.paymentTransaction.updateMany({
        where: { orderId: order.id },
        data: { status: 'failed' },
      });

      // 4. Create timeline entry
      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          action: 'order_cancelled',
          fromStatus: 'pending_payment',
          toStatus: 'cancelled',
          description: 'Order cancelled due to payment timeout',
          actorType: 'system',
        },
      });

      this.logger.log(`Cancelled expired order ${order.code} (deadline: ${order.paymentDeadline})`);
    });
  }
}
