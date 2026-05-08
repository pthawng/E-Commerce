import { API_ENDPOINTS, type AiSearchResponse } from '@shared';
import { apiGet } from '@/services/apiClient';

export interface AiSearchParams {
  query: string;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export const searchApi = {
  async searchProducts(params: AiSearchParams, signal?: AbortSignal) {
    const searchParams = new URLSearchParams({
      q: params.query,
    });

    if (params.limit) searchParams.append('limit', String(params.limit));
    if (params.category) searchParams.append('category', params.category);
    if (params.minPrice !== undefined) searchParams.append('minPrice', String(params.minPrice));
    if (params.maxPrice !== undefined) searchParams.append('maxPrice', String(params.maxPrice));

    const endpoint = `${API_ENDPOINTS.AI.SEARCH}?${searchParams.toString()}`;
    const response = await apiGet<AiSearchResponse>(endpoint, { signal });
    return response.data;
  },
};
