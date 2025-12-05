/**
 * Users Queries
 * TanStack Query hooks cho user management
 */
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiGet } from '../apiClient';
import type { User, PaginatedResponse } from '@shared/types';
import { API_ENDPOINTS } from '@shared/config';
import type { PaginationQuery } from '@shared/types';

/**
 * Get users list
 */
export function useUsers(filters?: PaginationQuery) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.sort) params.append('sort', filters.sort);
      if (filters?.order) params.append('order', filters.order);

      const queryString = params.toString();
      const path = queryString
        ? `${API_ENDPOINTS.USERS.BASE}?${queryString}`
        : API_ENDPOINTS.USERS.BASE;

      const response = await apiGet<PaginatedResponse<User>>(path);
      return response.data;
    },
  });
}

/**
 * Get user by ID
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      const response = await apiGet<User>(API_ENDPOINTS.USERS.BY_ID(id));
      return response.data;
    },
    enabled: !!id, // Only fetch if id exists
  });
}

