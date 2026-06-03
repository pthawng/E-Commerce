import { z } from 'zod';

const positiveInt = (max: number) => z.number().int().min(1).max(max);
const nonNegativeInt = (max: number) => z.number().int().min(0).max(max);
const durationToken = z.string().regex(/^\d+[smhd]$/, 'Duration must use s, m, h, or d suffix');

export const SETTINGS_REGISTRY = {
  'auth.mfa.required': {
    group: 'auth',
    description: 'Whether back-office MFA is required for staff accounts.',
    defaultValue: true,
    schema: z.boolean(),
  },
  'auth.mfa.totpWindowSeconds': {
    group: 'auth',
    description: 'Allowed TOTP clock drift in seconds.',
    defaultValue: 300,
    schema: positiveInt(600),
  },
  'auth.mfa.tempTokenTtl': {
    group: 'auth',
    description: 'Temporary MFA challenge/setup token lifetime.',
    defaultValue: '5m',
    schema: durationToken,
  },
  'auth.password.minLength': {
    group: 'auth',
    description: 'Minimum password length for customer and staff password flows.',
    defaultValue: 8,
    schema: z.number().int().min(8).max(128),
  },
  'auth.session.backOfficeTtlHours': {
    group: 'auth',
    description: 'Back-office session lifetime in hours.',
    defaultValue: 12,
    schema: positiveInt(168),
  },
  'auth.invitation.expiryHours': {
    group: 'auth',
    description: 'Staff invitation lifetime in hours.',
    defaultValue: 48,
    schema: positiveInt(336),
  },
  'order.checkoutTimeoutMinutes': {
    group: 'order',
    description: 'Checkout token lifetime in minutes.',
    defaultValue: 15,
    schema: positiveInt(120),
  },
  'order.paymentTimeoutMinutes': {
    group: 'order',
    description: 'Payment completion window in minutes before an order is considered stale.',
    defaultValue: 15,
    schema: positiveInt(240),
  },
  'order.cancelWindowMinutes': {
    group: 'order',
    description: 'Customer-facing cancellation window after order creation.',
    defaultValue: 15,
    schema: nonNegativeInt(1440),
  },
  'order.shippingFeeVnd': {
    group: 'order',
    description: 'Default order shipping fee in VND.',
    defaultValue: 30000,
    schema: nonNegativeInt(10000000),
  },
  'order.freeShippingThresholdVnd': {
    group: 'order',
    description: 'Cart subtotal threshold for free shipping in VND.',
    defaultValue: 2000000,
    schema: nonNegativeInt(1000000000),
  },
  'inventory.lowStockThreshold': {
    group: 'inventory',
    description: 'Quantity below which inventory is treated as low stock.',
    defaultValue: 5,
    schema: positiveInt(1000000),
  },
  'inventory.criticalStockThreshold': {
    group: 'inventory',
    description: 'Quantity at or below which inventory is treated as critical stock.',
    defaultValue: 1,
    schema: nonNegativeInt(1000000),
  },
  'customer.vipThresholdVnd': {
    group: 'customer',
    description: 'Lifetime value threshold for VIP promotion in VND.',
    defaultValue: 200000000,
    schema: positiveInt(100000000000),
  },
  'system.pagination.defaultLimit': {
    group: 'system',
    description: 'Default API pagination limit.',
    defaultValue: 20,
    schema: positiveInt(100),
  },
  'system.pagination.maxLimit': {
    group: 'system',
    description: 'Maximum API pagination limit.',
    defaultValue: 100,
    schema: positiveInt(500),
  },
  'system.pagination.maxPage': {
    group: 'system',
    description: 'Maximum offset pagination page.',
    defaultValue: 500,
    schema: positiveInt(10000),
  },
  'system.retry.maxRetries': {
    group: 'system',
    description: 'Default retry attempts for retryable system operations.',
    defaultValue: 3,
    schema: nonNegativeInt(20),
  },
  'system.retry.backoffMs': {
    group: 'system',
    description: 'Default retry backoff in milliseconds.',
    defaultValue: 50,
    schema: positiveInt(60000),
  },
  'system.cartTtlDays': {
    group: 'system',
    description: 'Cart lifetime in days.',
    defaultValue: 30,
    schema: positiveInt(365),
  },
  'system.idempotencyTtlHours': {
    group: 'system',
    description: 'Idempotency record lifetime in hours.',
    defaultValue: 24,
    schema: positiveInt(168),
  },
  'system.maxCartQuantityPerItem': {
    group: 'system',
    description: 'Maximum cart quantity allowed for one line item.',
    defaultValue: 99,
    schema: positiveInt(10000),
  },
} as const;

export type SettingKey = keyof typeof SETTINGS_REGISTRY;
export type SettingValue = string | number | boolean;
export type SettingGroup = (typeof SETTINGS_REGISTRY)[SettingKey]['group'];

export const SETTING_KEYS = Object.keys(SETTINGS_REGISTRY) as SettingKey[];

export function isSettingKey(key: string): key is SettingKey {
  return Object.prototype.hasOwnProperty.call(SETTINGS_REGISTRY, key);
}

export function getDefaultSettingValue(key: SettingKey): SettingValue {
  return SETTINGS_REGISTRY[key].defaultValue;
}

export function validateSettingValue(key: SettingKey, value: unknown): SettingValue {
  return SETTINGS_REGISTRY[key].schema.parse(value) as SettingValue;
}

export function getDefaultSettings(): Record<SettingKey, SettingValue> {
  return SETTING_KEYS.reduce(
    (acc, key) => {
      acc[key] = getDefaultSettingValue(key);
      return acc;
    },
    {} as Record<SettingKey, SettingValue>,
  );
}
