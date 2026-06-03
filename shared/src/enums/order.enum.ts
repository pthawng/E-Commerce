/**
 * Order Status Enum
 * Order status
 */
export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  MATERIAL_RESERVED = 'MATERIAL_RESERVED',
  IN_PRODUCTION = 'IN_PRODUCTION',
  QC = 'QC',
  READY_TO_SHIP = 'READY_TO_SHIP',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
  REFUNDED = 'REFUNDED',

  /** @deprecated Use PENDING_PAYMENT. */
  PENDING = 'PENDING_PAYMENT',
  /** @deprecated Use IN_PRODUCTION. */
  PROCESSING = 'IN_PRODUCTION',
  /** @deprecated Use SHIPPED. */
  SHIPPING = 'SHIPPED',
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

/**
 * Payment Processing Status Enum
 * Mirrors Prisma PaymentProcessingStatus.
 */
export enum PaymentProcessingStatus {
  INIT = 'INIT',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
}

/**
 * Payment Method Enum
 * Mirrors Prisma PaymentMethodEnum.
 */
export enum PaymentMethod {
  COD = 'COD',
  VNPAY = 'VNPAY',
  PAYPAL = 'PAYPAL',
  VIETQR = 'VIETQR',
}

