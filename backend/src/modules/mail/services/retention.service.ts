import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxStatus } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmailRetentionService {
  private readonly logger = new Logger(EmailRetentionService.name);
  private readonly archiveDir = path.join(process.cwd(), 'archives', 'emails');

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await fs.mkdir(this.archiveDir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }
  }

  /**
   * L8 Tiered Retention Policy
   * Hot DB -> Local Archive (Pre-S3 Stub) -> Delete
   * Runs every day at 3 AM.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async executeRetentionPolicy() {
    this.logger.log('Starting Email Retention Policy Execution...');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      // 1. Archive & Delete SENT/DELIVERED outboxes > 30 days
      const oldSuccessBatch = await this.prisma.emailOutbox.findMany({
        where: {
          status: { in: [OutboxStatus.SENT, OutboxStatus.DELIVERED] },
          createdAt: { lt: thirtyDaysAgo },
        },
        take: 1000,
      });

      if (oldSuccessBatch.length > 0) {
        await this.archiveRecords(oldSuccessBatch, 'success');

        await this.prisma.emailOutbox.deleteMany({
          where: { id: { in: oldSuccessBatch.map((r) => r.id) } },
        });
        this.logger.log(
          `Archived and removed ${oldSuccessBatch.length} successful emails older than 30 days.`,
        );
      }

      // 2. Delete non-critical FAILED outboxes > 7 days
      // Critical = order, payment, auth, password
      const oldFailedNonCritical = await this.prisma.emailOutbox.deleteMany({
        where: {
          status: {
            in: [
              OutboxStatus.FAILED,
              OutboxStatus.BOUNCED,
              OutboxStatus.SPAM,
              OutboxStatus.REJECTED,
            ],
          },
          createdAt: { lt: sevenDaysAgo },
          NOT: [
            { eventType: { contains: 'order' } },
            { eventType: { contains: 'payment' } },
            { eventType: { contains: 'auth' } },
            { eventType: { contains: 'password' } },
          ],
        },
      });

      if (oldFailedNonCritical.count > 0) {
        this.logger.log(
          `Deleted ${oldFailedNonCritical.count} non-critical failed emails older than 7 days.`,
        );
      }

      // 3. Delete ALL FAILED outboxes > 30 days (Even critical ones, if unresolved after 30 days, they expire from HOT DB)
      const oldFailedCritical = await this.prisma.emailOutbox.deleteMany({
        where: {
          status: {
            in: [
              OutboxStatus.FAILED,
              OutboxStatus.BOUNCED,
              OutboxStatus.SPAM,
              OutboxStatus.REJECTED,
            ],
          },
          createdAt: { lt: thirtyDaysAgo },
        },
      });

      if (oldFailedCritical.count > 0) {
        this.logger.log(
          `Deleted ${oldFailedCritical.count} critical failed emails older than 30 days.`,
        );
      }
    } catch (error) {
      this.logger.error(`Retention policy execution failed: ${error.message}`, error.stack);
    }
  }

  private async archiveRecords(records: any[], type: string) {
    // In production, this would stream to Amazon S3 / Google Cloud Storage.
    // For now, we write JSONL (JSON Lines) for cheap local cold storage.
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `email_archive_${type}_${dateStr}.jsonl`;
    const filePath = path.join(this.archiveDir, filename);

    const data = records.map((r) => JSON.stringify(r)).join('\n') + '\n';
    await fs.appendFile(filePath, data, 'utf-8');
  }
}
