import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmailOutboxService {
  private readonly logger = new Logger(EmailOutboxService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomic record creation.
   * Should be called within a business transaction if possible.
   */
  async create(
    data: {
      eventType: string;
      recipient: string;
      subject: string;
      templateName: string;
      context: any;
      idempotencyKey: string;
      templateVersion?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;

    return client.emailOutbox.upsert({
      where: { idempotencyKey: data.idempotencyKey },
      update: {}, // Avoid overwriting if already exists
      create: {
        eventType: data.eventType,
        recipient: data.recipient,
        subject: data.subject,
        templateName: data.templateName,
        templateVersion: data.templateVersion || 'v1',
        context: data.context,
        idempotencyKey: data.idempotencyKey,
        status: 'PENDING',
      },
    });
  }

  /**
   * Picking up batches using SKIP LOCKED for multi-relay safety.
   */
  async getPendingBatch(batchSize: number = 20) {
    // Prisma doesn't natively support SKIP LOCKED in the fluent API for all versions.
    return this.prisma.$queryRaw<any[]>`
      SELECT * FROM "email_outbox"
      WHERE "status" = 'PENDING' AND "scheduledAt" <= NOW()
      ORDER BY "scheduledAt" ASC
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED
    `;
  }

  async markAsProcessing(ids: string[]) {
    return this.prisma.emailOutbox.updateMany({
      where: { id: { in: ids } },
      data: { status: 'PROCESSING' },
    });
  }

  async markAsSent(id: string, provider: string, providerMessageId: string) {
    return this.prisma.emailOutbox.update({
      where: { id },
      data: {
        status: 'SENT',
        provider,
        providerMessageId,
        processedAt: new Date(),
      },
    });
  }

  async markAsFailed(id: string, error: string, attempts: number) {
    const status = attempts >= 5 ? 'FAILED' : 'PENDING'; // Retry logic
    return this.prisma.emailOutbox.update({
      where: { id },
      data: {
        status,
        lastError: error,
        attempts: { increment: 1 },
      },
    });
  }

  /**
   * Updates status based on Webhook events (e.g., from SendGrid or SES).
   * Note: SendGrid often appends suffix data to 'sg_message_id' in webhooks.
   */
  async updateStatusByProviderMessageId(
    providerMessageId: string,
    status: 'DELIVERED' | 'BOUNCED' | 'SPAM' | 'REJECTED',
  ) {
    const baseId = providerMessageId.split('.')[0];

    // Prisma does not support startingWith on unique fields cleanly,
    // so we find First matching the prefix.
    const record = await this.prisma.emailOutbox.findFirst({
      where: {
        providerMessageId: {
          startsWith: baseId,
        },
      },
    });

    if (record) {
      await this.prisma.emailOutbox.update({
        where: { id: record.id },
        data: { status },
      });
      this.logger.log(`Updated email outbox ${record.id} to ${status}`);
      return true;
    }

    this.logger.warn(`Could not find EmailOutbox for providerMessageId: ${providerMessageId}`);
    return false;
  }
}
