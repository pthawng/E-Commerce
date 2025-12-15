import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiGet } from '@/shared/api/api-client';
import type { Order, OrderSummary, PaginatedResponse, PaginationQuery } from '@shared';
import { API_ENDPOINTS } from '@shared';

export function useOrders(filters?: PaginationQuery) {
    return useQuery({
        queryKey: queryKeys.orders.list(filters as any),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.limit) params.append('limit', filters.limit.toString());
            if (filters?.search) params.append('search', filters.search);
            if (filters?.sort) params.append('sort', filters.sort);
            if (filters?.order) params.append('order', filters.order);

            const queryString = params.toString();
            const path = queryString
                ? `${API_ENDPOINTS.ORDERS.BASE}?${queryString}`
                : API_ENDPOINTS.ORDERS.BASE;

            const response = await apiGet<PaginatedResponse<OrderSummary>>(path);
            return response.data;
        },
    });
}

export function useOrder(id: string) {
    return useQuery({
        queryKey: queryKeys.orders.detail(id),
        queryFn: async () => {
            const response = await apiGet<Order>(API_ENDPOINTS.ORDERS.BY_ID(id));
            return response.data;
        },
        enabled: !!id,
    });
}

export function useOrderByCode(code: string) {
    return useQuery({
        queryKey: queryKeys.orders.byCode(code),
        queryFn: async () => {
            const response = await apiGet<Order>(API_ENDPOINTS.ORDERS.BY_CODE(code));
            return response.data;
        },
        enabled: !!code,
    });
}
