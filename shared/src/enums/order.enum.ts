/**
 * Order Status Enum
 * Order status
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
 * Payment status
 */
export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

/**
 * Transaction Type Enum
 * Payment transaction type
 */
export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
}

/**
 * Transaction Status Enum
 * Transaction status
 */
export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

