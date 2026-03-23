import { useAuthStore } from '../model/authStore';
import { useCallback } from 'react';

export const useAuth = () => {
    const { user, isAuthenticated, login, logout, permissions } = useAuthStore();
    return { user, isAuthenticated, login, logout, permissions };
};

export const usePermission = () => {
    const { permissions, user } = useAuthStore();

    const can = useCallback((permission: string) => {
        // Admin/Manager bypass
        const roleStr = user?.role?.toString().toLowerCase();
        if (['admin', 'manager'].includes(roleStr || '')) return true;

        if (permissions.includes('*')) return true;

        // Fallback or specific check for development
        if (permission.startsWith('order.') && (!permissions || permissions.length === 0)) return true;
        if (permission.startsWith('product.') && (!permissions || permissions.length === 0)) return true;
        if (permission.startsWith('inventory.')) return true;

        return permissions.includes(permission);
    }, [permissions, user]);

    return { can, user };
};
