import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhookIdempotencyService {
  private readonly logger = new Logger(WebhookIdempotencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a webhook has already been processed and mark it as processing if not.
   * This uses the database's unique constraint as the final source of truth.
   */
  async startProcessing(provider: string, externalTxnId: string, payload: any): Promise<boolean> {
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

    try {
      await this.prisma.processedWebhook.create({
        data: {
          provider,
          externalTxnId,
          status: 'PROCESSING',
          payloadHash,
          metadata: { startedAt: new Date().toISOString() },
        },
      });
      return true;
    } catch (error) {
      // If P2002 (Unique constraint failed), it means it's already processed or processing
      if (error.code === 'P2002') {
        const existing = await this.prisma.processedWebhook.findUnique({
          where: { provider_externalTxnId: { provider, externalTxnId } },
        });

        if (existing?.status === 'SUCCESS') {
          this.logger.log(`Webhook ${provider}:${externalTxnId} already processed successfully.`);
          return false;
        }

        if (existing?.status === 'PROCESSING') {
          // If it's been processing for too long (e.g., > 5 mins), we might want to allow a retry
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          if (existing.processedAt < fiveMinutesAgo) {
            this.logger.warn(`Webhook ${provider}:${externalTxnId} stuck in PROCESSING for >5m. Allowing retry.`);
            await this.prisma.processedWebhook.update({
              where: { id: existing.id },
              data: { status: 'PROCESSING', processedAt: new Date() },
            });
            return true;
          }
          this.logger.warn(`Webhook ${provider}:${externalTxnId} is currently being processed by another worker.`);
          return false;
        }

        // If it failed before, we allow retry
        if (existing?.status === 'FAILED') {
          await this.prisma.processedWebhook.update({
            where: { id: existing.id },
            data: { status: 'PROCESSING', processedAt: new Date() },
          });
          return true;
        }
      }
      throw error;
    }
  }

  async complete(provider: string, externalTxnId: string, metadata?: any): Promise<void> {
    await this.prisma.processedWebhook.update({
      where: { provider_externalTxnId: { provider, externalTxnId } },
      data: {
        status: 'SUCCESS',
        metadata: { ...(metadata || {}), completedAt: new Date().toISOString() },
      },
    });
  }

  async fail(provider: string, externalTxnId: string, error: string): Promise<void> {
    await this.prisma.processedWebhook.update({
      where: { provider_externalTxnId: { provider, externalTxnId } },
      data: {
        status: 'FAILED',
        metadata: { error, failedAt: new Date().toISOString() },
      },
    }).catch(err => this.logger.error(`Failed to mark webhook as failed: ${err.message}`));
  }
}
