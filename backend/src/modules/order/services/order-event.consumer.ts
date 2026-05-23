import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { OrderStatusEnum } from '@prisma/client';
import { Job } from 'bull';
import { PrismaService } from 'src/prisma/prisma.service';
import { TracingService } from '../../infra/tracing.service';
import { InventoryService } from '../../inventory/inventory.service';
import { MailService } from '../../mail/mail.service';

import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor('system-events')
export class OrderEventConsumer {
  private readonly logger = new Logger(OrderEventConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly mailService: MailService,
    private readonly tracing: TracingService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Process('order.status.changed')
  async handleOrderStatusChanged(
    job: Job<{
      orderId: string;
      oldStatus: OrderStatusEnum;
      newStatus: OrderStatusEnum;
      actorId?: string;
      stateMetadata?: any;
      outboxId?: string;
    }>,
  ) {
    const payload = job.data;

    return this.tracing.trace(`order.event.process:${payload.newStatus}`, async (span) => {
      span.setAttributes({
        'order.id': payload.orderId,
        'order.status.old': payload.oldStatus,
        'order.status.new': payload.newStatus,
        'outbox.id': payload.outboxId || 'none',
      });

      this.logger.log(
        `[Bull] Processing order.status.changed for ${payload.orderId}: ${payload.oldStatus} -> ${payload.newStatus}`,
      );

      try {
        // 1. Inventory Logic
        await this.tracing.trace('inventory.side_effect', () =>
          this.handleInventorySideEffects(payload),
        );

        // 2. Notification Logic
        await this.tracing.trace('notification.side_effect', () =>
          this.handleNotifications(payload),
        );

        // 3. Mark Outbox as PROCESSED
        if (payload.outboxId) {
          await this.prisma.domainEventOutbox.update({
            where: { id: payload.outboxId },
            data: { status: 'PROCESSED', processedAt: new Date() },
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
        this.logger.error(`Error processing order.status.changed for ${payload.orderId}:`, error);

        if (payload.outboxId) {
          await this.prisma.domainEventOutbox.update({
            where: { id: payload.outboxId },
            data: {
              status: 'FAILED',
              lastError: (error as Error).message,
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

    switch (newStatus as any) {
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

  private async handleNotifications(payload: { orderId: string; newStatus: OrderStatusEnum }) {
    // Implement resilient notifications here
  }
}
