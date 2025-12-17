import { apiGet } from '@/services/apiClient';
import type { Product } from '@shared';
import { API_ENDPOINTS } from '@shared';

export async function getProduct(id: string) {
    const response = await apiGet<Product>(API_ENDPOINTS.PRODUCTS.BY_ID(id));
    return response.data;
}
