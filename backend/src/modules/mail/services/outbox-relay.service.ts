import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bull';
import { EmailOutboxService } from './email-outbox.service';

@Injectable()
export class OutboxRelayService {
  private readonly logger = new Logger(OutboxRelayService.name);
  private isProcessing = false;

  constructor(
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    private readonly outboxService: EmailOutboxService,
  ) {}

  /**
   * Polls the outbox every 10 seconds.
   * Uses SKIP LOCKED in the service layer to support multiple instances.
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async processRelay() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const batch = await this.outboxService.getPendingBatch(20);

      if (batch.length === 0) {
        this.isProcessing = false;
        return;
      }

      this.logger.log(`Relaying ${batch.length} emails to BullMQ...`);

      const ids = batch.map((row) => row.id);
      await this.outboxService.markAsProcessing(ids);

      for (const row of batch) {
        let priority = 10; // Default Low
        if (
          row.eventType.includes('password') ||
          row.eventType.includes('auth') ||
          row.eventType.includes('verify')
        ) {
          priority = 1; // High
        } else if (
          row.eventType.includes('order') ||
          row.eventType.includes('payment') ||
          row.eventType.includes('shipping')
        ) {
          priority = 5; // Medium
        }

        await this.emailQueue.add(
          'send-email',
          {
            outboxId: row.id,
            recipient: row.recipient,
            subject: row.subject,
            templateName: row.templateName,
            templateVersion: row.templateVersion,
            context: row.context,
            attempts: row.attempts,
          },
          {
            priority,
            jobId: `outbox-${row.id}`, // Idempotency at queue level
            attempts: 1, // Bull retries are managed by Outbox status instead
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
      }
    } catch (error) {
      this.logger.error(`Error in OutboxRelay: ${error.message}`, error.stack);
    } finally {
      this.isProcessing = false;
    }
  }
}
