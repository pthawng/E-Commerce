import { OrderStatusEnum } from '@prisma/client';

export class OrderStatusValidator {
  private static readonly VALID_TRANSITIONS: Record<string, OrderStatusEnum[]> = {
    [OrderStatusEnum.PENDING_PAYMENT]: [OrderStatusEnum.CONFIRMED, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.CONFIRMED]: [OrderStatusEnum.MATERIAL_RESERVED, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.MATERIAL_RESERVED]: [OrderStatusEnum.IN_PRODUCTION, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.IN_PRODUCTION]: [OrderStatusEnum.QC, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.QC]: [OrderStatusEnum.READY_TO_SHIP, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.READY_TO_SHIP]: [OrderStatusEnum.SHIPPED, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.SHIPPED]: [OrderStatusEnum.DELIVERED, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.DELIVERED]: [OrderStatusEnum.COMPLETED, OrderStatusEnum.RETURNED],
    [OrderStatusEnum.RETURNED]: [OrderStatusEnum.REFUNDED],
    [OrderStatusEnum.COMPLETED]: [OrderStatusEnum.REFUNDED],
    [OrderStatusEnum.CANCELLED]: [],
    [OrderStatusEnum.REFUNDED]: [],
    [OrderStatusEnum.DRAFT]: [OrderStatusEnum.PENDING_PAYMENT],
  };

  static isValidTransition(currentStatus: OrderStatusEnum, nextStatus: OrderStatusEnum): boolean {
    const transitions = this.VALID_TRANSITIONS[currentStatus];
    if (!transitions) return false;
    return transitions.includes(nextStatus);
  }

  static getNextStatuses(currentStatus: OrderStatusEnum): OrderStatusEnum[] {
    return this.VALID_TRANSITIONS[currentStatus] || [];
  }
}
