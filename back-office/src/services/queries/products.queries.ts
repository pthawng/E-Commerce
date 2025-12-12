/**
 * Products Queries
 * TanStack Query hooks cho product management
 */
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiGet } from '../apiClient';
import type { Product, ProductSummary, PaginatedResponse, PaginationQuery } from '@shared';
import { API_ENDPOINTS } from '@shared';

/**
 * Get products list
 */
export function useProducts(filters?: PaginationQuery) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: async () => {
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

      const items = Array.isArray(response.data) ? response.data : response.data?.items || [];

      type RawMeta = {
        page?: number;
        limit?: number;
        total?: number;
        totalItems?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
      };

      const rawMeta: RawMeta | null =
        (response.meta as RawMeta | null | undefined) ??
        ((response as unknown as { meta?: RawMeta }).meta ?? null);

      const normalizedMeta = rawMeta
        ? {
            page: rawMeta.page ?? 1,
            limit: rawMeta.limit ?? items.length ?? 0,
            total: rawMeta.total ?? rawMeta.totalItems ?? items.length ?? 0,
            totalPages:
              rawMeta.totalPages ??
              Math.max(
                1,
                Math.ceil(
                  (rawMeta.totalItems ?? items.length ?? 0) /
                    (rawMeta.limit || items.length || 1),
                ),
              ),
            hasNext: rawMeta.hasNext ?? false,
            hasPrev: rawMeta.hasPrev ?? false,
          }
        : {
            page: 1,
            limit: items.length,
            total: items.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          };

      return { items, meta: normalizedMeta } satisfies PaginatedResponse<ProductSummary>;
    },
  });
}

/**
 * Get product by ID
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: async () => {
      const response = await apiGet<Product>(API_ENDPOINTS.PRODUCTS.BY_ID(id));
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Get product by slug
 */
export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.products.bySlug(slug),
    queryFn: async () => {
      const response = await apiGet<Product>(
        API_ENDPOINTS.PRODUCTS.BY_SLUG(slug),
      );
      return response.data;
    },
    enabled: !!slug,
  });
}

