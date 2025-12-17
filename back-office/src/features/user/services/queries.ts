import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiGet } from '@/services/apiClient';
import type { User, PaginatedResponse, PaginationQuery } from '@shared';
import { API_ENDPOINTS } from '@shared';

const USERS_LIST = `${API_ENDPOINTS.USERS.BASE}/list`;

export function useUsers(filters?: PaginationQuery & { role?: string; permission?: string }) {
    return useQuery({
        queryKey: queryKeys.users.list(filters as any),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.limit) params.append('limit', filters.limit.toString());
            if (filters?.search) params.append('search', filters.search);
            if (filters?.sort) params.append('sort', filters.sort);
            if (filters?.order) params.append('order', filters.order);
            if (filters?.role) params.append('role', filters.role);
            if (filters?.permission) params.append('permission', filters.permission);

            const queryString = params.toString();
            const path = queryString ? `${USERS_LIST}?${queryString}` : USERS_LIST;

            const response = await apiGet<PaginatedResponse<User>>(path);
            return {
                items: (response.data as unknown as PaginatedResponse<User>)?.items ?? (Array.isArray(response.data) ? response.data : []),
                meta: response.meta,
            } as PaginatedResponse<User>;
        },
    });
}

export function useUser(id: string) {
    return useQuery({
        queryKey: queryKeys.users.detail(id),
        queryFn: async () => {
            const response = await apiGet<User>(API_ENDPOINTS.USERS.BY_ID(id));
            return response.data;
        },
        enabled: !!id,
    });
}
