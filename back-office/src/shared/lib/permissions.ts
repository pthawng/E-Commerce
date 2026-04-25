/**
 * Centralized Permission Slugs - Mirroring Backend (permissions.constants.ts)
 */
export const PERMISSIONS = {
    AUTH: {
        USER: {
            CREATE: 'auth.user.create',
            READ: 'auth.user.read',
            UPDATE: 'auth.user.update',
            DELETE: 'auth.user.delete',
        }
    },
    ORDER: {
        READ: 'order.read',
        UPDATE: 'order.update',
        SHIPMENT_MANAGE: 'order.shipment.manage',
        REFUND: 'order.refund',
    },
    INVENTORY: {
        READ: 'inventory.read',
        MANAGE: 'inventory.manage',
        ADJUST: 'inventory.adjust',
    },
    LEDGER: {
        READ: 'ledger.read',
        EXPORT: 'ledger.export',
    },
    DASHBOARD: {
        VIEW: 'dashboard.view',
    }
} as const;

export type PermissionSlug = string; // In a real app, this would be a deep union
