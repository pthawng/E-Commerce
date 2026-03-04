export type Permission = string;

export const PERMISSIONS = {
    ORDER: {
        READ: 'order.read',
        CREATE: 'order.create',
        UPDATE: 'order.update',
        DELETE: 'order.delete',
    },
    PRODUCT: {
        ITEM: { READ: 'product.item.read' },
        CATEGORY: { READ: 'product.category.read' },
        ATTRIBUTE: { READ: 'product.attribute.read' },
        VARIANT: { READ: 'product.variant.read' }
    },
    AUTH: {
        USER: {
            READ: 'auth.user.read',
            CREATE: 'auth.user.create',
            UPDATE: 'auth.user.update',
            DELETE: 'auth.user.delete',
            ASSIGN_ROLE: 'auth.user.assign-role',
            ASSIGN_PERMISSION: 'auth.user.assign-permission',
        },
        ROLE: {
            READ: 'auth.role.read',
            CREATE: 'auth.role.create',
            UPDATE: 'auth.role.update',
            DELETE: 'auth.role.delete',
        }
    },
    DASHBOARD: {
        VIEW: 'dashboard.view',
    }
} as const;
