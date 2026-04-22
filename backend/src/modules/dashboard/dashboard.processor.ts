import { Process, Processor } from '@nestjs/bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Cache } from 'cache-manager';

@Processor('system-events')
export class DashboardEventProcessor {
  private readonly logger = new Logger(DashboardEventProcessor.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  @Process('order.status.updated')
  async handleOrderStatusUpdated(job: Job) {
    this.logger.log(`[DLQ-Safe] Invalidate cache for job ${job.id}`);
    try {
      // Idempotent native eviction
      await this.cacheManager.del('dashboard_stats');
      await this.cacheManager.del('dashboard_revenue_7d');

      this.logger.log(`Cache strictly invalidated for outbox ID: ${job.data.outboxId}`);
    } catch (error: any) {
      this.logger.error(`Cache hook failure: ${error.message}`, error.stack);
      throw error; // Fails intentionally to trigger Bull DLQ logic
    }
  }
}
