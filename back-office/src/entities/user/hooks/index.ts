import { useAuthStore } from '../model/authStore';
import { useCallback } from 'react';

export const useAuth = () => {
    const { user, isAuthenticated, login, logout, permissions } = useAuthStore();
    return { user, isAuthenticated, login, logout, permissions };
};

export const usePermission = () => {
    const { permissions, user } = useAuthStore();

    const can = useCallback((permission: string) => {
        if (!user || !user.role) return false;

        // 1. Principal Bypass (Explicit Role-based)
        const roleStr = user.role.toString().toLowerCase();
        if (['admin', 'manager', 'super_admin'].includes(roleStr)) return true;

        // 2. Wildcard Bypass
        if (permissions.includes('*')) return true;

        // 3. Strict Permission Match (Fail-Closed)
        // Note: Production-grade ensures no hardcoded dev fallbacks
        return permissions.includes(permission);
    }, [permissions, user]);

    return { can, user };
};
