import { BadRequestException } from '@nestjs/common';
import { OrderStatusEnum } from 'src/generated/prisma/client';

export class OrderStatusValidator {
  private static readonly VALID_TRANSITIONS: Record<OrderStatusEnum, OrderStatusEnum[]> = {
    [OrderStatusEnum.pending_payment]: [OrderStatusEnum.confirmed, OrderStatusEnum.cancelled],
    [OrderStatusEnum.pending]: [OrderStatusEnum.confirmed, OrderStatusEnum.cancelled],
    [OrderStatusEnum.confirmed]: [OrderStatusEnum.processing, OrderStatusEnum.cancelled],
    [OrderStatusEnum.processing]: [OrderStatusEnum.shipping, OrderStatusEnum.cancelled],
    [OrderStatusEnum.shipping]: [OrderStatusEnum.delivered, OrderStatusEnum.cancelled],
    [OrderStatusEnum.delivered]: [OrderStatusEnum.completed, OrderStatusEnum.returned],
    [OrderStatusEnum.returned]: [OrderStatusEnum.refunded],
    [OrderStatusEnum.completed]: [],
    [OrderStatusEnum.cancelled]: [],
    [OrderStatusEnum.refunded]: [],
  };

  /**
   * Validates if a transition from currentStatus to nextStatus is allowed.
   * Throws BadRequestException if the transition is invalid.
   */
  static validate(orderId: string, currentStatus: OrderStatusEnum, nextStatus: OrderStatusEnum): void {
    if (currentStatus === nextStatus) {
      return; // No change needed
    }

    const allowedNextStatuses = this.VALID_TRANSITIONS[currentStatus];

    if (!allowedNextStatuses || !allowedNextStatuses.includes(nextStatus)) {
      throw new BadRequestException(
        `Invalid status transition for order ${orderId}: ${currentStatus} -> ${nextStatus}. ` +
        `Allowed transitions: [${allowedNextStatuses?.join(', ') || 'none'}]`
      );
    }
  }
}
