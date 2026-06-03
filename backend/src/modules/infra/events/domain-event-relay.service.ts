import { RequestContextService } from '@modules/observability/request-context.service';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventOutboxStatus } from '@prisma/client';
import { Queue } from 'bull';
import { PrismaService } from '../../../prisma/prisma.service';

const MAX_RELAY_ATTEMPTS = 5;

@Injectable()
export class DomainEventRelayService {
  private readonly logger = new Logger(DomainEventRelayService.name);
  private isPolling = false;

  constructor(
    private prisma: PrismaService,
    @InjectQueue('system-events') private systemEventsQueue: Queue,
    private readonly requestContext: RequestContextService,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutbox(): Promise<void> {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      // Pessimistic polling (limit to prevent memory burst)
      const events = await this.prisma.domainEventOutbox.findMany({
        where: { status: EventOutboxStatus.PENDING },
        take: 100,
        orderBy: { createdAt: 'asc' },
      });

      if (events.length === 0) return;

      const eventIds = events.map((e) => e.id);
      // Mark as PROCESSING
      await this.prisma.domainEventOutbox.updateMany({
        where: { id: { in: eventIds }, status: EventOutboxStatus.PENDING },
        data: { status: EventOutboxStatus.PROCESSING, lastError: null },
      });

      for (const event of events) {
        try {
          const aggregateId = event.aggregateId || this.getAggregateId(event.payload);
          const correlationId =
            event.correlationId ||
            this.getCorrelationId(event.payload) ||
            this.requestContext.getCorrelationId();
          // Dispatch to resilient queue
          await this.systemEventsQueue.add(
            event.eventType,
            {
              ...this.toQueuePayload(event.payload),
              outboxId: event.id,
              aggregateId,
              correlationId,
            },
            { jobId: `event:${event.id}` },
          );

          this.logger.log(
            `[OutboxRelay] dispatched eventId=${event.id} eventType=${
              event.eventType
            } aggregateId=${aggregateId} correlationId=${correlationId || 'none'} attempt=${
              event.retryCount + 1
            }`,
          );
        } catch (err) {
          const nextRetryCount = event.retryCount + 1;
          const message = err instanceof Error ? err.message : String(err);
          const stack = err instanceof Error ? err.stack : undefined;

          this.logger.error(
            `[OutboxRelay] queue dispatch failed eventId=${event.id} eventType=${event.eventType} attempt=${nextRetryCount}`,
            stack,
          );

          await this.prisma.domainEventOutbox.update({
            where: { id: event.id },
            data: {
              status:
                nextRetryCount >= MAX_RELAY_ATTEMPTS
                  ? EventOutboxStatus.FAILED
                  : EventOutboxStatus.PENDING,
              retryCount: { increment: 1 },
              lastError: message,
              failureReason: message,
              lastProcessedAt: new Date(),
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

  /**
   * P1 Resilience: Outbox Lag Detection
   * Monitors for events stuck in non-terminal states.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async monitorLag(): Promise<void> {
    const threshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
    const stuckEvents = await this.prisma.domainEventOutbox.count({
      where: {
        status: { in: [EventOutboxStatus.PENDING, EventOutboxStatus.PROCESSING] },
        createdAt: { lt: threshold },
      },
    });

    if (stuckEvents > 0) {
      this.logger.error(`[CRITICAL] OUTBOX LAG DETECTED: ${stuckEvents} events stuck > 5m!`);
      // Production deployments should wire this to the team's alerting channel.
    }
  }

  async requeueFailedAndStuck(olderThanMinutes = 5, limit = 100): Promise<number> {
    const threshold = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    const candidates = await this.prisma.domainEventOutbox.findMany({
      where: {
        OR: [
          { status: EventOutboxStatus.FAILED },
          { status: EventOutboxStatus.PROCESSING, createdAt: { lt: threshold } },
        ],
      },
      select: { id: true },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });

    if (candidates.length === 0) {
      return 0;
    }

    const result = await this.prisma.domainEventOutbox.updateMany({
      where: { id: { in: candidates.map((event) => event.id) } },
      data: {
        status: EventOutboxStatus.PENDING,
        lastError: null,
        failureReason: null,
        processedAt: null,
      },
    });

    this.logger.warn(`[OutboxReplay] requeued ${result.count} failed/stuck events`);
    return result.count;
  }

  private toQueuePayload(payload: unknown): Record<string, unknown> {
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      return payload as Record<string, unknown>;
    }

    return { payload };
  }

  private getAggregateId(payload: unknown): string {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return 'unknown';
    }

    const candidate = payload as Record<string, unknown>;
    const aggregateId = candidate.aggregateId ?? candidate.orderId ?? candidate.paymentId;
    return typeof aggregateId === 'string' ? aggregateId : 'unknown';
  }

  private getCorrelationId(payload: unknown): string | undefined {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return undefined;
    }

    const candidate = payload as Record<string, unknown>;
    const correlationId = candidate.correlationId;
    return typeof correlationId === 'string' ? correlationId : undefined;
  }
}
