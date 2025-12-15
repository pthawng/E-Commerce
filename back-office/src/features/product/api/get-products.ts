import { apiGet } from '@/shared/api/api-client';
import type { ProductSummary, PaginatedResponse, PaginationQuery } from '@shared';
import { API_ENDPOINTS } from '@shared';

export async function getProducts(filters?: PaginationQuery) {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sort) params.append('sort', filters.sort);
    if (filters?.order) params.append('order', filters.order);

    const queryString = params.toString();
    const path = queryString
        ? `${API_ENDPOINTS.PRODUCTS.BASE}?${queryString}`
        : API_ENDPOINTS.PRODUCTS.BASE;

    const response = await apiGet<PaginatedResponse<ProductSummary>>(path);
    return response.data;
}
