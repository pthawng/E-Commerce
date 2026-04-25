import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderStatusEnum } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { InventoryService } from '../../inventory/inventory.service';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class OrderEventConsumer {
    private readonly logger = new Logger(OrderEventConsumer.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly inventoryService: InventoryService,
        private readonly mailService: MailService,
    ) { }

    @OnEvent('order.status.changed')
    async handleOrderStatusChanged(payload: {
        orderId: string;
        oldStatus: OrderStatusEnum;
        newStatus: OrderStatusEnum;
        actorId?: string;
        stateMetadata?: any;
    }) {
        this.logger.log(`Handling order.status.changed: ${payload.orderId} (${payload.oldStatus} -> ${payload.newStatus})`);

        try {
            // 1. Inventory Logic (Decoupled side-effects)
            await this.handleInventorySideEffects(payload);

            // 2. Notification Logic
            await this.handleNotifications(payload);
        } catch (error) {
            this.logger.error(`Error processing order.status.changed for ${payload.orderId}:`, error);
            // In a real FAANG system, this would trigger a retry if it's a transient error
            // or move the outbox record to a FAILED state for manual intervention.
        }
    }

    private async handleInventorySideEffects(payload: {
        orderId: string;
        newStatus: OrderStatusEnum;
    }) {
        const { orderId, newStatus } = payload;

        switch (newStatus as any) {
            case 'CONFIRMED':
                // Transition from Reserved to Deducted (Real stock removal)
                this.logger.log(`Deducting inventory for confirmed order ${orderId}`);
                await this.inventoryService.deduct(orderId);
                break;

            case 'CANCELLED':
                // Release reservations
                this.logger.log(`Releasing inventory for cancelled order ${orderId}`);
                await this.inventoryService.release(orderId);
                break;

            default:
                // Other statuses might not require immediate inventory mutation
                break;
        }
    }

    private async handleNotifications(payload: {
        orderId: string;
        newStatus: OrderStatusEnum;
    }) {
        // Logic for sending emails/SMS based on specific status transitions
        // This is now decoupled from the core transaction.
    }
}
