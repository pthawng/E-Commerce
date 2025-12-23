import { useAuthStore } from '@/features/auth/hooks/useAuthStore';
import { useCallback } from 'react';

/**
 * Hook to check if current user has specific permissions
 * 
 * Usage:
 * const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
 * 
 * if (hasPermission('user.create')) {
 *   // Show create user button
 * }
 */
export function usePermissions() {
    const permissions = useAuthStore((state) => state.permissions);

    const hasPermission = useCallback((permission: string): boolean => {
        return permissions.includes(permission);
    }, [permissions]);

    const hasAnyPermission = useCallback((requiredPermissions: string[]): boolean => {
        return requiredPermissions.some((p) => permissions.includes(p));
    }, [permissions]);

    const hasAllPermissions = useCallback((requiredPermissions: string[]): boolean => {
        return requiredPermissions.every((p) => permissions.includes(p));
    }, [permissions]);

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        permissions,
    };
}
