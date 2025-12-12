/**
 * RBAC Queries
 * TanStack Query hooks cho RBAC admin (roles, permissions)
 */
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiGet } from '../apiClient';
import { API_ENDPOINTS } from '@shared';

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
  slug: string;
  name: string;
  description?: string | null;
  module?: string | null;
  action?: string | null;
  _count?: {
    roles?: number;
    userPermissions?: number;
  };
}

export function useRbacRoles() {
  return useQuery({
    queryKey: queryKeys.rbac.roles.list(),
    queryFn: async () => {
      const res = await apiGet<RbacRole[]>(`${API_ENDPOINTS.RBAC.BASE}/roles`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });
}

export function useRbacRole(slug: string) {
  return useQuery({
    queryKey: queryKeys.rbac.roles.detail(slug),
    queryFn: async () => {
      const res = await apiGet<RbacRole>(`${API_ENDPOINTS.RBAC.BASE}/roles/${slug}`);
      return res.data;
    },
    enabled: !!slug,
  });
}

export function useRbacPermissions() {
  return useQuery({
    queryKey: queryKeys.rbac.permissions.list(),
    queryFn: async () => {
      const res = await apiGet<RbacPermission[]>(`${API_ENDPOINTS.RBAC.BASE}/permissions`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });
}

export function useRbacPermission(slug: string) {
  return useQuery({
    queryKey: queryKeys.rbac.permissions.detail(slug),
    queryFn: async () => {
      const res = await apiGet<RbacPermission>(`${API_ENDPOINTS.RBAC.BASE}/permissions/${slug}`);
      return res.data;
    },
    enabled: !!slug,
  });
}

