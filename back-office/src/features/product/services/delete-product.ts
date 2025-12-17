import { apiDelete } from '@/services/apiClient';
import { API_ENDPOINTS } from '@shared';

export async function deleteProduct(id: string) {
    const response = await apiDelete<void>(API_ENDPOINTS.PRODUCTS.BY_ID(id));
    return response.data;
}
