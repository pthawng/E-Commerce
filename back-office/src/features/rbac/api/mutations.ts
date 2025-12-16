import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiPost, apiPatch, apiDelete } from '@/shared/api/api-client';
import type { RbacPermission, RbacRole } from './queries';

const RBAC_BASE = '/api/admin/rbac';

// -------- Roles --------

export function useCreateRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: { slug: string; name: string; description?: string; isSystem?: boolean }) => {
            const res = await apiPost<RbacRole>(`${RBAC_BASE}/roles`, data);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.rbac.roles.list() });
        },
    });
}

export function useUpdateRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({
            slug,
            data,
        }: {
            slug: string;
            data: { name?: string; description?: string };
        }) => {
            const res = await apiPatch<RbacRole>(`${RBAC_BASE}/roles/${slug}`, data);
            return res.data;
        },
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: queryKeys.rbac.roles.list() });
            qc.invalidateQueries({ queryKey: queryKeys.rbac.roles.detail(variables.slug) });
        },
    });
}

export function useDeleteRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (slug: string) => {
            const res = await apiDelete(`${RBAC_BASE}/roles/${slug}`);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.rbac.roles.list() });
        },
    });
}

// -------- Permissions --------

export function useCreatePermission() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            slug: string;
            name: string;
            description?: string;
            module?: string;
            action?: string;
        }) => {
            const res = await apiPost<RbacPermission>(`${RBAC_BASE}/permissions`, data);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.rbac.permissions.list() });
        },
    });
}

export function useUpdatePermission() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({
            slug,
            data,
        }: {
            slug: string;
            data: { name?: string; description?: string; module?: string; action?: string };
        }) => {
            const res = await apiPatch<RbacPermission>(`${RBAC_BASE}/permissions/${slug}`, data);
            return res.data;
        },
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: queryKeys.rbac.permissions.list() });
            qc.invalidateQueries({ queryKey: queryKeys.rbac.permissions.detail(variables.slug) });
        },
    });
}

export function useDeletePermission() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (slug: string) => {
            const res = await apiDelete(`${RBAC_BASE}/permissions/${slug}`);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.rbac.permissions.list() });
        },
    });
}

// -------- User assignments --------

export function useAssignRoleToUser() {
    return useMutation({
        mutationFn: async (params: { userId: string; roleSlug: string }) => {
            const { userId, roleSlug } = params;
            const res = await apiPost(`${RBAC_BASE}/users/${userId}/roles`, {
                userId,
                roleSlug,
            });
            return res.data;
        },
    });
}

export function useRemoveRoleFromUser() {
    return useMutation({
        mutationFn: async (params: { userId: string; roleSlug: string }) => {
            const { userId, roleSlug } = params;
            const res = await apiDelete(`${RBAC_BASE}/users/${userId}/roles/${roleSlug}`);
            return res.data;
        },
    });
}

export function useAssignPermissionToUser() {
    return useMutation({
        mutationFn: async (params: { userId: string; permissionSlug: string }) => {
            const { userId, permissionSlug } = params;
            const res = await apiPost(`${RBAC_BASE}/users/${userId}/permissions`, {
                targetId: userId,
                permissionSlug,
            });
            return res.data;
        },
    });
}

export function useRemovePermissionFromUser() {
    return useMutation({
        mutationFn: async (params: { userId: string; permissionSlug: string }) => {
            const { userId, permissionSlug } = params;
            const res = await apiDelete(
                `${RBAC_BASE}/users/${userId}/permissions/${permissionSlug}`,
            );
            return res.data;
        },
    });
}

// -------- Role - Permission assignments --------

export function useAssignPermissionToRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (params: { roleSlug: string; permissionSlug: string }) => {
            const { roleSlug, permissionSlug } = params;
            const res = await apiPost(`${RBAC_BASE}/roles/${roleSlug}/permissions`, {
                permissionSlug,
            });
            return res.data;
        },
        onSuccess: (_data, { roleSlug }) => {
            qc.invalidateQueries({ queryKey: queryKeys.rbac.roles.list() });
            qc.invalidateQueries({ queryKey: queryKeys.rbac.roles.detail(roleSlug) });
        },
    });
}

export function useRemovePermissionFromRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (params: { roleSlug: string; permissionSlug: string }) => {
            const { roleSlug, permissionSlug } = params;
            const res = await apiDelete(
                `${RBAC_BASE}/roles/${roleSlug}/permissions/${permissionSlug}`,
            );
            return res.data;
        },
        onSuccess: (_data, { roleSlug }) => {
            qc.invalidateQueries({ queryKey: queryKeys.rbac.roles.list() });
            qc.invalidateQueries({ queryKey: queryKeys.rbac.roles.detail(roleSlug) });
        },
    });
}