import { apiGet } from '@/services/apiClient';
import type { ProductSummary, PaginatedResponse, PaginationQuery } from '@shared';
import { API_ENDPOINTS } from '@shared';

export async function getProducts(filters?: PaginationQuery): Promise<PaginatedResponse<ProductSummary>> {
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

    // BE đang trả kiểu: { success, statusCode, ..., data: ProductSummary[], meta }
    const response = await apiGet<ProductSummary[]>(path);

    return {
        items: response.data ?? [],
        meta: response.meta!,
    };
}
