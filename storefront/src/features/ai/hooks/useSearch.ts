import { useQuery } from '@tanstack/react-query';
import { searchApi, type AiSearchParams } from '../api/searchApi';

export function useAiSearch(params: AiSearchParams & { enabled?: boolean }) {
  const normalizedQuery = params.query.trim();
  const enabled = params.enabled !== false && normalizedQuery.length > 0;

  return useQuery({
    queryKey: [
      'ai',
      'search',
      normalizedQuery,
      params.limit ?? 12,
      params.category ?? null,
      params.minPrice ?? null,
      params.maxPrice ?? null,
    ],
    queryFn: ({ signal }) =>
      searchApi.searchProducts(
        {
          ...params,
          query: normalizedQuery,
        },
        signal,
      ),
    enabled,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}
