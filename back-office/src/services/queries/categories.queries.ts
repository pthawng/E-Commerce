/**
 * Categories Queries
 * TanStack Query hooks cho category management
 */
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiGet } from '../apiClient';
import type { Category, PaginationQuery } from '@shared';
import { API_ENDPOINTS } from '@shared';

/**
 * Get categories tree
 */
export function useCategories(includeInactive?: boolean) {
  return useQuery({
    queryKey: queryKeys.categories.list({ includeInactive }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (includeInactive !== undefined) {
        params.append('includeInactive', String(includeInactive));
      }

      const queryString = params.toString();
      const path = queryString
        ? `${API_ENDPOINTS.CATEGORIES.BASE}?${queryString}`
        : API_ENDPOINTS.CATEGORIES.BASE;

      const response = await apiGet<Category[]>(path);
      return Array.isArray(response.data) ? response.data : [];
    },
  });
}

/**
 * Get category by ID
 */
export function useCategory(id: string) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: async () => {
      const response = await apiGet<Category>(API_ENDPOINTS.CATEGORIES.BY_ID(id));
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Get category by slug
 */
export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.categories.bySlug(slug),
    queryFn: async () => {
      const response = await apiGet<Category>(API_ENDPOINTS.CATEGORIES.BY_SLUG(slug));
      return response.data;
    },
    enabled: !!slug,
  });
}

