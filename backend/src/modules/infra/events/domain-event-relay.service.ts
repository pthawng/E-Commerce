import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bull';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DomainEventRelayService {
  private readonly logger = new Logger(DomainEventRelayService.name);
  private isPolling = false;

  constructor(
    private prisma: PrismaService,
    @InjectQueue('system-events') private systemEventsQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutbox() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      // Pessimistic polling (limit to prevent memory burst)
      const events = await this.prisma.domainEventOutbox.findMany({
        where: { status: 'PENDING' },
        take: 100,
        orderBy: { createdAt: 'asc' },
      });

      if (events.length === 0) return;

      const eventIds = events.map((e) => e.id);
      // Mark as PROCESSING
      await this.prisma.domainEventOutbox.updateMany({
        where: { id: { in: eventIds } },
        data: { status: 'PROCESSING' },
      });

      for (const event of events) {
        try {
          // Dispatch to resilient queue
          await this.systemEventsQueue.add(
            event.eventType,
            {
              ...(event.payload as object),
              outboxId: event.id,
            },
            { jobId: `event:${event.id}` },
          );

          // Ack Local
          await this.prisma.domainEventOutbox.update({
            where: { id: event.id },
            data: { status: 'PROCESSED', processedAt: new Date() },
          });
        } catch (err: any) {
          this.logger.error(`Fail queue dispatch for event ${event.id}`, err);

          await this.prisma.domainEventOutbox.update({
            where: { id: event.id },
            data: {
              status: event.retryCount >= 5 ? 'FAILED' : 'PENDING',
              retryCount: { increment: 1 },
              lastError: err.message,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error('Outbox Relay Engine Frame Error', error);
    } finally {
      this.isPolling = false;
    }
  }
}
