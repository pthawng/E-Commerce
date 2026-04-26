import { API_ENDPOINTS, type RecommendationResponse } from '@shared';
import { apiGet } from '@/services/apiClient';

export const recommendationApi = {
  async getRecommendations(productId: string, limit: number = 4, signal?: AbortSignal) {
    const endpoint = `${API_ENDPOINTS.AI.RECOMMENDATIONS}?productId=${encodeURIComponent(productId)}&limit=${limit}`;
    const response = await apiGet<RecommendationResponse>(endpoint, { signal });
    return response.data;
  },
};
