import { useAuthStore } from '../model/authStore';
import { useCallback } from 'react';

export const useAuth = () => {
    const { user, isAuthenticated, login, logout, permissions } = useAuthStore();
    return { user, isAuthenticated, login, logout, permissions };
};

export const usePermission = () => {
    const { permissions } = useAuthStore();

    const can = useCallback((permission: string) => {
        // Super admin bypass (optional, but good for dev)
        // if (permissions.includes('*')) return true;

        return permissions.includes(permission);
    }, [permissions]);

    return { can };
};
