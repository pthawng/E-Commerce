import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CartCleanupService {
  private readonly logger = new Logger(CartCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredCarts() {
    this.logger.log('Starting expired cart cleanup...');
    try {
      const now = new Date();
      const result = await this.prisma.cart.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });
      this.logger.log(`Cleaned up ${result.count} expired carts.`);
    } catch (error) {
      this.logger.error('Failed to cleanup expired carts', error.stack);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredIdempotencyRecords() {
    this.logger.log('Starting expired idempotency records cleanup...');
    try {
      const now = new Date();
      const result = await this.prisma.idempotencyRecord.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });
      this.logger.log(`Cleaned up ${result.count} expired idempotency records.`);
    } catch (error) {
      this.logger.error('Failed to cleanup idempotency records', error.stack);
    }
  }
}
