/**
 * Order Constants
 * Constants cho Order - labels, configs
 */

import { OrderStatus, PaymentStatus } from '../enums';

/**
 * Order Status Labels (Vietnamese)
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Chờ xử lý',
  [OrderStatus.CONFIRMED]: 'Đã xác nhận',
  [OrderStatus.PROCESSING]: 'Đang xử lý',
  [OrderStatus.SHIPPING]: 'Đang giao hàng',
  [OrderStatus.DELIVERED]: 'Đã giao hàng',
  [OrderStatus.COMPLETED]: 'Hoàn thành',
  [OrderStatus.CANCELLED]: 'Đã hủy',
  [OrderStatus.RETURNED]: 'Đã trả hàng',
  [OrderStatus.REFUNDED]: 'Đã hoàn tiền',
};

/**
 * Payment Status Labels (Vietnamese)
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: 'Chưa thanh toán',
  [PaymentStatus.PARTIALLY_PAID]: 'Thanh toán một phần',
  [PaymentStatus.PAID]: 'Đã thanh toán',
  [PaymentStatus.REFUNDED]: 'Đã hoàn tiền',
};

/**
 * Order Status Colors (for UI)
 */
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'yellow',
  [OrderStatus.CONFIRMED]: 'blue',
  [OrderStatus.PROCESSING]: 'purple',
  [OrderStatus.SHIPPING]: 'indigo',
  [OrderStatus.DELIVERED]: 'green',
  [OrderStatus.COMPLETED]: 'green',
  [OrderStatus.CANCELLED]: 'red',
  [OrderStatus.RETURNED]: 'orange',
  [OrderStatus.REFUNDED]: 'gray',
};

/**
 * Payment Status Colors (for UI)
 */
export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: 'red',
  [PaymentStatus.PARTIALLY_PAID]: 'yellow',
  [PaymentStatus.PAID]: 'green',
  [PaymentStatus.REFUNDED]: 'gray',
};

