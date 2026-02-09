export type Permission = string;

export const PERMISSIONS = {
    ORDER: {
        READ: 'order.read',
        CREATE: 'order.create',
        UPDATE: 'order.update',
        DELETE: 'order.delete',
    },
    PRODUCT: {
        READ: 'product.read',
        CREATE: 'product.create',
        UPDATE: 'product.update',
        DELETE: 'product.delete',
    },
    USER: {
        READ: 'user.read',
        MANAGE: 'user.manage',
    },
    DASHBOARD: {
        VIEW: 'dashboard.view',
    }
} as const;
