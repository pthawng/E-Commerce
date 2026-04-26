import { useQuery } from '@tanstack/react-query';
import { recommendationApi } from '../api/recommendationApi';

export function useRecommendations(productId?: string, limit: number = 4) {
  return useQuery({
    queryKey: ['ai', 'recommendations', productId ?? 'none', limit],
    queryFn: ({ signal }) => recommendationApi.getRecommendations(productId!, limit, signal),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
