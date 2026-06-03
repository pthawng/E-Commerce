/**
 * Permission Module Enum
 * Permission modules
 */
export enum PermissionModule {
  AUTH = 'AUTH',
  USER = 'USER',
  PRODUCT = 'PRODUCT',
  CATALOG = 'CATALOG',
  ORDER = 'ORDER',
  DISCOUNT = 'DISCOUNT',
  CMS = 'CMS',
  SYSTEM = 'SYSTEM',
  INVENTORY = 'INVENTORY',
  LEDGER = 'LEDGER',
  CRM = 'CRM',
}

/**
 * Permission Action Enum
 * Permission actions
 */
export enum PermissionAction {
  READ = 'READ',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MANAGE = 'MANAGE',
}

export enum UserType {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum StaffStatus {
  ACTIVE = 'ACTIVE',
  MFA_SETUP_REQUIRED = 'MFA_SETUP_REQUIRED',
  SUSPENDED = 'SUSPENDED',
  DISABLED = 'DISABLED',
}

export enum StaffInvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum BackOfficeAuthNextStep {
  MFA_REQUIRED = 'MFA_REQUIRED',
  MFA_SETUP_REQUIRED = 'MFA_SETUP_REQUIRED',
}

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

export type PermissionSlug = NestedValues<typeof PERMISSIONS>;

