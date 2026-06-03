import { OrderStatus } from '@shared';
import type { OrderStatusValue } from '@shared';

type TranslationFn = (
  key: string,
  variables?: Record<string, string | number>,
  defaultValue?: string,
) => string;

const statusTranslationKeys: Record<OrderStatusValue, string> = {
  [OrderStatus.DRAFT]: 'pending',
  [OrderStatus.PENDING_PAYMENT]: 'pending_payment',
  [OrderStatus.CONFIRMED]: 'confirmed',
  [OrderStatus.MATERIAL_RESERVED]: 'processing',
  [OrderStatus.IN_PRODUCTION]: 'processing',
  [OrderStatus.QC]: 'processing',
  [OrderStatus.READY_TO_SHIP]: 'shipping',
  [OrderStatus.SHIPPED]: 'shipping',
  [OrderStatus.DELIVERED]: 'delivered',
  [OrderStatus.COMPLETED]: 'completed',
  [OrderStatus.CANCELLED]: 'cancelled',
  [OrderStatus.RETURNED]: 'returned',
  [OrderStatus.REFUNDED]: 'refunded',
};

const statusToneClasses: Record<OrderStatusValue, string> = {
  [OrderStatus.DRAFT]: 'text-gold-light border-gold-light/20 bg-gold-shimmer/10',
  [OrderStatus.PENDING_PAYMENT]: 'text-gold-light border-gold-light/20 bg-gold-shimmer/10',
  [OrderStatus.CONFIRMED]: 'text-gold border-gold/30 bg-gold-shimmer/20',
  [OrderStatus.MATERIAL_RESERVED]: 'text-primary/70 border-primary/20 bg-primary/5',
  [OrderStatus.IN_PRODUCTION]: 'text-primary/70 border-primary/20 bg-primary/5',
  [OrderStatus.QC]: 'text-primary/70 border-primary/20 bg-primary/5',
  [OrderStatus.READY_TO_SHIP]: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
  [OrderStatus.SHIPPED]: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
  [OrderStatus.DELIVERED]: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
  [OrderStatus.COMPLETED]: 'text-primary/60 border-primary/10 bg-primary/5',
  [OrderStatus.CANCELLED]: 'text-destructive border-destructive/20 bg-destructive/5',
  [OrderStatus.RETURNED]: 'text-destructive border-destructive/20 bg-destructive/5',
  [OrderStatus.REFUNDED]: 'text-primary/60 border-primary/10 bg-primary/5',
};

export const getOrderStatusTranslationKey = (status: OrderStatusValue): string =>
  statusTranslationKeys[status] ?? status.toLowerCase();

export const getOrderStatusToneClass = (status: OrderStatusValue): string =>
  statusToneClasses[status] ?? 'text-muted-foreground border-primary/10';

export const formatOrderStatusFallback = (status: OrderStatusValue): string =>
  status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const getOrderStatusLabel = (status: OrderStatusValue, t: TranslationFn): string =>
  t(
    `account.orders.status.${getOrderStatusTranslationKey(status)}`,
    undefined,
    formatOrderStatusFallback(status),
  );

export const hasPaymentFailureTimeline = (timelines: { action: string }[] = []): boolean =>
  timelines.some((event) => event.action.includes('PAYMENT_FAILED'));
