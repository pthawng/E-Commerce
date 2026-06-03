import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventOutboxStatus, OrderStatusEnum } from '@prisma/client';
import { Job } from 'bull';
import { PrismaService } from 'src/prisma/prisma.service';
import { TracingService } from '../../infra/tracing.service';
import { InventoryService } from '../../inventory/inventory.service';
import { MailService } from '../../mail/mail.service';
import { DomainActivityService } from '../../observability/domain-activity.service';

@Processor('system-events')
export class OrderEventConsumer {
  private readonly logger = new Logger(OrderEventConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly mailService: MailService,
    private readonly tracing: TracingService,
    private readonly eventEmitter: EventEmitter2,
    private readonly activity: DomainActivityService,
  ) {}

  @Process('order.status.changed')
  async handleOrderStatusChanged(
    job: Job<{
      orderId: string;
      oldStatus: OrderStatusEnum;
      newStatus: OrderStatusEnum;
      actorId?: string;
      stateMetadata?: unknown;
      outboxId?: string;
      aggregateId?: string;
      correlationId?: string;
    }>,
  ) {
    const payload = job.data;
    const attempt = job.attemptsMade + 1;
    const maxAttempts = this.getMaxAttempts(job);

    return this.tracing.trace(`order.event.process:${payload.newStatus}`, async (span) => {
      span.setAttributes({
        'order.id': payload.orderId,
        'order.status.old': payload.oldStatus,
        'order.status.new': payload.newStatus,
        'outbox.id': payload.outboxId || 'none',
        'correlation.id': payload.correlationId || 'none',
        'event.attempt': attempt,
        'event.max_attempts': maxAttempts,
      });

      this.logger.log(
        `[Bull] Processing order.status.changed eventId=${
          payload.outboxId || 'none'
        } aggregateId=${payload.orderId} correlationId=${
          payload.correlationId || 'none'
        } attempt=${attempt}/${maxAttempts}: ${payload.oldStatus} -> ${payload.newStatus}`,
      );

      try {
        if (payload.outboxId) {
          const existingEvent = await this.prisma.domainEventOutbox.findUnique({
            where: { id: payload.outboxId },
            select: { status: true },
          });

          if (existingEvent?.status === EventOutboxStatus.PROCESSED) {
            this.logger.warn(
              `[Bull] Skipping already handled order.status.changed eventId=${payload.outboxId} aggregateId=${payload.orderId}`,
            );
            return;
          }
        }

        // 1. Inventory Logic
        await this.tracing.trace('inventory.side_effect', () =>
          this.handleInventorySideEffects(payload),
        );

        await this.recordInventoryActivity(payload);

        // 2. Notification Logic
        await this.tracing.trace('notification.side_effect', () =>
          this.handleNotifications(payload),
        );

        // 3. Mark Outbox as PROCESSED
        if (payload.outboxId) {
          await this.prisma.domainEventOutbox.update({
            where: { id: payload.outboxId },
            data: {
              status: EventOutboxStatus.PROCESSED,
              processedAt: new Date(),
              firstProcessedAt: new Date(),
              lastProcessedAt: new Date(),
              lastError: null,
              failureReason: null,
              aggregateId: payload.aggregateId || payload.orderId,
              correlationId: payload.correlationId,
            },
          });
        }

        // 4. Stream to Nerve Center (SSE)
        this.eventEmitter.emit('nerve.center.event', {
          type: 'ORDER_STATUS_UPDATED',
          orderId: payload.orderId,
          status: payload.newStatus,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        const finalAttempt = attempt >= maxAttempts;
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;

        this.logger.error(
          `[Bull] Error processing order.status.changed eventId=${payload.outboxId || 'none'} aggregateId=${payload.orderId} attempt=${attempt}/${maxAttempts}`,
          stack,
        );

        if (payload.outboxId) {
          await this.prisma.domainEventOutbox.update({
            where: { id: payload.outboxId },
            data: {
              status: finalAttempt ? EventOutboxStatus.FAILED : EventOutboxStatus.PROCESSING,
              lastError: message,
              failureReason: message,
              lastProcessedAt: new Date(),
              aggregateId: payload.aggregateId || payload.orderId,
              correlationId: payload.correlationId,
              retryCount: { increment: 1 },
            },
          });
        }

        throw error;
      }
    });
  }

  private async handleInventorySideEffects(payload: {
    orderId: string;
    newStatus: OrderStatusEnum;
  }) {
    const { orderId, newStatus } = payload;

    switch (newStatus) {
      case 'CONFIRMED':
        this.logger.log(`Deducting inventory for confirmed order ${orderId}`);
        await this.inventoryService.deduct(orderId);
        break;

      case 'CANCELLED':
        this.logger.log(`Releasing inventory for cancelled order ${orderId}`);
        await this.inventoryService.release(orderId);
        break;

      default:
        break;
    }
  }

  private async recordInventoryActivity(payload: {
    orderId: string;
    newStatus: OrderStatusEnum;
    outboxId?: string;
    correlationId?: string;
  }) {
    switch (payload.newStatus) {
      case 'CONFIRMED':
        await this.activity.recordOrderActivity({
          orderId: payload.orderId,
          action: 'INVENTORY_COMMITTED',
          description: 'Inventory committed after order confirmation',
          metadata: {
            outboxId: payload.outboxId,
            correlationId: payload.correlationId,
          },
        });
        break;
      case 'CANCELLED':
        await this.activity.recordOrderActivity({
          orderId: payload.orderId,
          action: 'INVENTORY_RELEASED',
          description: 'Inventory released after order cancellation',
          metadata: {
            outboxId: payload.outboxId,
            correlationId: payload.correlationId,
          },
        });
        break;
      default:
        break;
    }
  }

  private async handleNotifications(_payload: { orderId: string; newStatus: OrderStatusEnum }) {
    // Implement resilient notifications here
  }

  private getMaxAttempts(job: Job): number {
    const attempts = job.opts?.attempts;
    return typeof attempts === 'number' && attempts > 0 ? attempts : 1;
  }
}
