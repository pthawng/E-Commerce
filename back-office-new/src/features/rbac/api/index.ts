import axiosClient from '@/shared/api/axiosClient';
import type { ApiResponse } from '@ecommerce/shared';
import type { Role, Permission, CreateRoleDTO, CreatePermissionDTO, UpdatePermissionDTO } from '../types';

/**
 * Unwraps the standard NestJS ApiResponse envelope.
 * All backend responses are shaped as: { success, statusCode, data: T, meta }
 * The axiosClient interceptor returns response.data (the HTTP body),
 * so we receive the full ApiResponse object and must extract `.data`.
 */
function unwrap<T>(envelope: unknown): T {
    return (envelope as ApiResponse<T>).data as T;
}

export const rbacApi = {
    // ==================== ROLES ====================

    /** GET /admin/rbac/roles → Role[] */
    getRoles: async (): Promise<Role[]> => {
        const envelope = await axiosClient.get('/admin/rbac/roles');
        return unwrap<Role[]>(envelope);
    },

    /** GET /admin/rbac/roles/:slug → Role */
    getRole: async (slug: string): Promise<Role> => {
        const envelope = await axiosClient.get(`/admin/rbac/roles/${slug}`);
        return unwrap<Role>(envelope);
    },

    /** POST /admin/rbac/roles → Role */
    createRole: async (data: CreateRoleDTO): Promise<Role> => {
        const envelope = await axiosClient.post('/admin/rbac/roles', data);
        return unwrap<Role>(envelope);
    },

    /** PATCH /admin/rbac/roles/:slug → Role (backend uses PATCH + slug, not PUT + id) */
    updateRole: async ({ id, data }: { id: string; data: Partial<CreateRoleDTO> }): Promise<Role> => {
        const envelope = await axiosClient.patch(`/admin/rbac/roles/${id}`, data);
        return unwrap<Role>(envelope);
    },

    /** DELETE /admin/rbac/roles/:slug */
    deleteRole: async (slug: string): Promise<void> => {
        await axiosClient.delete(`/admin/rbac/roles/${slug}`);
    },

    // ==================== PERMISSIONS ====================

    /** GET /admin/rbac/permissions → Permission[] */
    getPermissions: async (): Promise<Permission[]> => {
        const envelope = await axiosClient.get('/admin/rbac/permissions');
        return unwrap<Permission[]>(envelope);
    },

    /** POST /admin/rbac/permissions → Permission */
    createPermission: async (data: CreatePermissionDTO): Promise<Permission> => {
        const envelope = await axiosClient.post('/admin/rbac/permissions', data);
        return unwrap<Permission>(envelope);
    },

    /** PATCH /admin/rbac/permissions/:slug → Permission (slug = action field in DB) */
    updatePermission: async ({ slug, data }: { slug: string; data: UpdatePermissionDTO }): Promise<Permission> => {
        const envelope = await axiosClient.patch(`/admin/rbac/permissions/${slug}`, data);
        return unwrap<Permission>(envelope);
    },

    /** DELETE /admin/rbac/permissions/:slug */
    deletePermission: async (slug: string): Promise<void> => {
        await axiosClient.delete(`/admin/rbac/permissions/${slug}`);
    },

    // ==================== ROLE-PERMISSION ASSIGNMENTS ====================

    /** POST /admin/rbac/roles/:roleSlug/permissions - assign permission to role */
    assignPermissionToRole: async ({ roleSlug, permissionSlug }: { roleSlug: string; permissionSlug: string }): Promise<void> => {
        await axiosClient.post(`/admin/rbac/roles/${roleSlug}/permissions`, { permissionSlug });
    },

    /** DELETE /admin/rbac/roles/:roleSlug/permissions/:permissionSlug - remove permission from role */
    removePermissionFromRole: async ({ roleSlug, permissionSlug }: { roleSlug: string; permissionSlug: string }): Promise<void> => {
        await axiosClient.delete(`/admin/rbac/roles/${roleSlug}/permissions/${permissionSlug}`);
    },
};
