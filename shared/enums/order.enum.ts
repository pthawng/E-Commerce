/**
 * Order Status Enum
 * Trạng thái đơn hàng
 */
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPING = 'shipping',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  REFUNDED = 'refunded',
}

/**
 * Payment Status Enum
 * Trạng thái thanh toán
 */
export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

/**
 * Transaction Type Enum
 * Loại giao dịch thanh toán
 */
export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
}

/**
 * Transaction Status Enum
 * Trạng thái giao dịch
 */
export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

