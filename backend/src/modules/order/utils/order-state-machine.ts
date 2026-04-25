import { BadRequestException } from '@nestjs/common';
import { OrderStatusEnum } from '@prisma/client';

export interface StateTransitionResult {
    allowed: boolean;
    message?: string;
}

export class OrderStateMachine {
    private static readonly VALID_TRANSITIONS: any = {
        ['DRAFT' as any]: ['PENDING_PAYMENT', 'CANCELLED'],
        ['PENDING_PAYMENT' as any]: ['CONFIRMED', 'CANCELLED'],
        ['CONFIRMED' as any]: ['MATERIAL_RESERVED', 'CANCELLED'],
        ['MATERIAL_RESERVED' as any]: ['IN_PRODUCTION', 'CANCELLED'],
        ['IN_PRODUCTION' as any]: ['QC', 'CANCELLED'],
        ['QC' as any]: ['READY_TO_SHIP', 'CANCELLED', 'IN_PRODUCTION'],
        ['READY_TO_SHIP' as any]: ['SHIPPED', 'CANCELLED'],
        ['SHIPPED' as any]: ['DELIVERED', 'RETURNED'],
        ['DELIVERED' as any]: ['COMPLETED', 'RETURNED'],
        ['RETURNED' as any]: ['REFUNDED'],
        ['COMPLETED' as any]: ['REFUNDED'],
        ['CANCELLED' as any]: [],
        ['REFUNDED' as any]: [],
    };

    /**
     * Validates a transition and checks for prerequisites in the order state metadata.
     */
    static validate(
        orderId: string,
        currentStatus: OrderStatusEnum,
        nextStatus: OrderStatusEnum,
        metadata: any = {}
    ): void {
        if (currentStatus === nextStatus) return;

        const allowed = this.VALID_TRANSITIONS[currentStatus];
        if (!allowed || !allowed.includes(nextStatus)) {
            throw new BadRequestException(
                `Invalid status transition for order ${orderId}: ${currentStatus} -> ${nextStatus}. ` +
                `Allowed next states: [${allowed?.join(', ') || 'none'}]`
            );
        }

        // Business Rule: Cannot go to READY_TO_SHIP if QC not passed
        if ((nextStatus as any) === 'READY_TO_SHIP' && !metadata.qcPassed) {
            throw new BadRequestException(`Order ${orderId} cannot be READY_TO_SHIP until Quality Control (QC) is passed.`);
        }

        // Business Rule: Cannot cancel if SHIPPED
        if ((nextStatus as any) === 'CANCELLED' && (currentStatus as any) === 'SHIPPED') {
            throw new BadRequestException(`Cannot cancel order ${orderId} once it has been shipped.`);
        }
    }

    static getNextStates(current: OrderStatusEnum): OrderStatusEnum[] {
        return this.VALID_TRANSITIONS[current] || [];
    }
}
