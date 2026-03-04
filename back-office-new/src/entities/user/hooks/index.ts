import { useAuthStore } from '../model/authStore';
import { useCallback } from 'react';

export const useAuth = () => {
    const { user, isAuthenticated, login, logout, permissions } = useAuthStore();
    return { user, isAuthenticated, login, logout, permissions };
};

export const usePermission = () => {
    const { permissions, user } = useAuthStore();

    const can = useCallback((permission: string) => {
        // Super admin bypass for development, or if user is admin
        const roleStr = user?.role?.toString().toLowerCase();
        if (roleStr === 'admin') return true;
        if (permissions.includes('*')) return true;

        // Fallback for demo if backend isn't sending permissions array yet
        if (!permissions || permissions.length === 0) return true;

        return permissions.includes(permission);
    }, [permissions, user]);

    return { can };
};
