import type {
  OrderStatus,
  PaymentMethod,
  PaymentProcessingStatus,
  PaymentStatus,
  TransactionStatus,
} from '../enums';

export type OrderStatusValue = `${OrderStatus}`;
export type PaymentStatusValue = `${PaymentStatus}`;
export type TransactionStatusValue = `${TransactionStatus}`;
export type PaymentProcessingStatusValue = `${PaymentProcessingStatus}`;
export type PaymentMethodValue = `${PaymentMethod}`;
