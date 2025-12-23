import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiGet } from '@/services/apiClient';

const RBAC_BASE = '/api/admin/rbac';

export interface RbacRole {
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    isSystem?: boolean;
    _count?: {
        userRoles?: number;
        rolePermissions?: number;
    };
    rolePermissions?: Array<{
        permission: RbacPermission;
    }>;
}

export interface RbacPermission {
    id: string;
    /** Business slug stored in backend column `action` */
    action: string;
    name: string;
    description?: string | null;
    module?: string | null;
    /**
     * Alias for backward-compatibility with old FE code.
     * In BE we no longer have `slug` column, we use `action` as slug.
     */
    slug?: string | null;
    _count?: {
        roles?: number;
        userPermissions?: number;
    };
}

export interface UserRoleAssignment {
    userId: string;
    roleId: string;
    assignedAt: string;
    assignedBy?: string | null;
    role: RbacRole;
}

export interface UserPermissionAssignment {
    userId: string;
    permissionId: string;
    assignedAt: string;
    assignedBy?: string | null;
    permission: RbacPermission;
}

type ApiPermission = Omit<RbacPermission, 'action'> & {
    action?: string | null;
};

const normalizePermission = (p: ApiPermission): RbacPermission => {
    const action = p.action || p.slug || '';
    return {
        ...p,
        action,
        slug: p.slug ?? action,
    };
};

export function useRbacRoles() {
    return useQuery({
        queryKey: queryKeys.rbac.roles.list(),
        queryFn: async () => {
            const res = await apiGet<RbacRole[]>(`${RBAC_BASE}/roles`);
            return Array.isArray(res.data) ? res.data : [];
        },
    });
}

export function useRbacRole(slug: string) {
    return useQuery({
        queryKey: queryKeys.rbac.roles.detail(slug),
        queryFn: async () => {
            const res = await apiGet<RbacRole>(`${RBAC_BASE}/roles/${slug}`);
            return res.data;
        },
        enabled: !!slug,
    });
}

export function useRbacPermissions() {
    return useQuery({
        queryKey: queryKeys.rbac.permissions.list(),
        queryFn: async () => {
            const res = await apiGet<ApiPermission[]>(`${RBAC_BASE}/permissions`);
            return Array.isArray(res.data) ? res.data.map(normalizePermission) : [];
        },
    });
}

export function useRbacPermission(slug: string) {
    return useQuery({
        queryKey: queryKeys.rbac.permissions.detail(slug),
        queryFn: async () => {
            const res = await apiGet<ApiPermission>(`${RBAC_BASE}/permissions/${slug}`);
            return normalizePermission(res.data as ApiPermission);
        },
        enabled: !!slug,
    });
}

export function useUserRoles(userId?: string, options?: { staleTime?: number; gcTime?: number }) {
    return useQuery({
        queryKey: queryKeys.rbac.userRoles(userId || ''),
        queryFn: async () => {
            const res = await apiGet<UserRoleAssignment[]>(`${RBAC_BASE}/users/${userId}/roles`);
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: !!userId,
        ...options,
    });
}

export function useUserPermissions(userId?: string, options?: { staleTime?: number; gcTime?: number }) {
    return useQuery({
        queryKey: queryKeys.rbac.userPermissions(userId || ''),
        queryFn: async () => {
            const res = await apiGet<UserPermissionAssignment[]>(
                `${RBAC_BASE}/users/${userId}/permissions`,
            );
            return Array.isArray(res.data) ? res.data.map((u) => ({
                ...u,
                permission: normalizePermission(u.permission as any),
            })) : [];
        },
        enabled: !!userId,
        ...options,
    });
}
