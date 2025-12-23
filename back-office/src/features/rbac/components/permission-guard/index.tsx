import { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionGuardProps {
    /** Required permission(s) */
    permission?: string | string[];
    /** Mode: 'any' = has any permission, 'all' = has all permissions */
    mode?: 'any' | 'all';
    /** Content to show when user has permission */
    children: ReactNode;
    /** Optional fallback content when user doesn't have permission */
    fallback?: ReactNode;
}

/**
 * Permission Guard Component
 * 
 * Conditionally renders children based on user permissions
 * 
 * Usage:
 * <PermissionGuard permission="user.create">
 *   <Button>Create User</Button>
 * </PermissionGuard>
 * 
 * <PermissionGuard permission={['user.update', 'user.delete']} mode="any">
 *   <Button>Edit User</Button>
 * </PermissionGuard>
 */
export function PermissionGuard({
    permission,
    mode = 'all',
    children,
    fallback = null,
}: PermissionGuardProps) {
    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

    // If no permission required, always show
    if (!permission) {
        return <>{children}</>;
    }

    // Single permission
    if (typeof permission === 'string') {
        return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
    }

    // Multiple permissions
    const hasAccess = mode === 'any'
        ? hasAnyPermission(permission)
        : hasAllPermissions(permission);

    return hasAccess ? <>{children}</> : <>{fallback}</>;
}
