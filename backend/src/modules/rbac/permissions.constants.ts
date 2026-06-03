/**
 * Centralized permission strings.
 * Acts as the single source of truth for all permission slugs.
 */
export const PERMISSIONS = {
  AUTH: {
    ROLE: {
      CREATE: 'auth.role.create',
      READ: 'auth.role.read',
      UPDATE: 'auth.role.update',
      DELETE: 'auth.role.delete',
    },
    USER: {
      CREATE: 'auth.user.create',
      READ: 'auth.user.read',
      UPDATE: 'auth.user.update',
      DELETE: 'auth.user.delete',
      ASSIGN_ROLE: 'auth.user.assign-role',
      ASSIGN_PERMISSION: 'auth.user.assign-permission',
    },
  },

  PRODUCT: {
    CATEGORY: {
      CREATE: 'product.category.create',
      READ: 'product.category.read',
      UPDATE: 'product.category.update',
      DELETE: 'product.category.delete',
    },

    ATTRIBUTE: {
      CREATE: 'product.attribute.create',
      READ: 'product.attribute.read',
      UPDATE: 'product.attribute.update',
      DELETE: 'product.attribute.delete',
    },

    ITEM: {
      CREATE: 'product.item.create',
      READ: 'product.item.read',
      UPDATE: 'product.item.update',
      DELETE: 'product.item.delete',
    },

    VARIANT: {
      CREATE: 'product.variant.create',
      READ: 'product.variant.read',
      UPDATE: 'product.variant.update',
      DELETE: 'product.variant.delete',
      MANAGE: 'product.variant.manage',
    },
  },

  CATALOG: {
    PRODUCT: {
      READ: 'catalog.product.read',
      CREATE: 'catalog.product.create',
      UPDATE: 'catalog.product.update',
      PUBLISH: 'catalog.product.publish',
      DELETE: 'catalog.product.delete',
    },
    PRICING: {
      READ: 'catalog.pricing.read',
      UPDATE: 'catalog.pricing.update',
    },
    IMPORT: {
      CREATE: 'catalog.import.create',
    },
    AUDIT: {
      READ: 'catalog.audit.read',
    },
  },

  ORDER: {
    READ: 'order.read',
    UPDATE: 'order.update',
    DELETE: 'order.delete',
    MANAGE_PAYMENT: 'order.payment.manage',
    SHIPMENT_MANAGE: 'order.shipment.manage',
    REFUND: 'order.refund',
  },
  INVENTORY: {
    READ: 'inventory.read',
    MANAGE: 'inventory.manage',
    TRANSFER: 'inventory.transfer',
    ADJUST: 'inventory.adjust',
  },
  LEDGER: {
    READ: 'ledger.view',
    MANAGE: 'ledger.manage',
  },
  DASHBOARD: {
    VIEW: 'dashboard.view',
  },
  SYSTEM: {
    SETTING: {
      READ: 'system.setting.read',
      UPDATE: 'system.setting.update',
    },
  },
  CRM: {
    GUEST: {
      READ: 'crm.guest.read',
    },
    VIP_CARE: {
      READ: 'crm.vip-care.read',
      MANAGE: 'crm.vip-care.manage',
    },
  },
} as const;

type NestedValues<T> = T extends string
  ? T
  : T extends object
    ? { [K in keyof T]: NestedValues<T[K]> }[keyof T]
    : never;

// Union type of all valid permission slugs
export type PermissionValue = NestedValues<typeof PERMISSIONS>;
