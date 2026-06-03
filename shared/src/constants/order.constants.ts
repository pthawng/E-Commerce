/**
 * Order Constants
 * Labels and UI colors keyed by backend-canonical status values.
 */

import { OrderStatus, PaymentStatus } from '../enums';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: 'Draft',
  [OrderStatus.PENDING_PAYMENT]: 'Pending payment',
  [OrderStatus.CONFIRMED]: 'Confirmed',
  [OrderStatus.MATERIAL_RESERVED]: 'Material reserved',
  [OrderStatus.IN_PRODUCTION]: 'In production',
  [OrderStatus.QC]: 'Quality check',
  [OrderStatus.READY_TO_SHIP]: 'Ready to ship',
  [OrderStatus.SHIPPED]: 'Shipped',
  [OrderStatus.DELIVERED]: 'Delivered',
  [OrderStatus.COMPLETED]: 'Completed',
  [OrderStatus.CANCELLED]: 'Cancelled',
  [OrderStatus.RETURNED]: 'Returned',
  [OrderStatus.REFUNDED]: 'Refunded',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: 'Unpaid',
  [PaymentStatus.PARTIALLY_PAID]: 'Partially paid',
  [PaymentStatus.PAID]: 'Paid',
  [PaymentStatus.REFUNDED]: 'Refunded',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: 'gray',
  [OrderStatus.PENDING_PAYMENT]: 'yellow',
  [OrderStatus.CONFIRMED]: 'blue',
  [OrderStatus.MATERIAL_RESERVED]: 'cyan',
  [OrderStatus.IN_PRODUCTION]: 'purple',
  [OrderStatus.QC]: 'amber',
  [OrderStatus.READY_TO_SHIP]: 'teal',
  [OrderStatus.SHIPPED]: 'indigo',
  [OrderStatus.DELIVERED]: 'green',
  [OrderStatus.COMPLETED]: 'green',
  [OrderStatus.CANCELLED]: 'red',
  [OrderStatus.RETURNED]: 'orange',
  [OrderStatus.REFUNDED]: 'gray',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: 'red',
  [PaymentStatus.PARTIALLY_PAID]: 'yellow',
  [PaymentStatus.PAID]: 'green',
  [PaymentStatus.REFUNDED]: 'gray',
};
