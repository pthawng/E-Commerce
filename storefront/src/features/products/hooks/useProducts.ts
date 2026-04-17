import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { productApi, type PaginatedResponse } from '../services/api';
import { Product, ProductParams } from '../types';

export const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (filters: ProductParams) => [...productKeys.lists(), filters] as const,
    details: () => [...productKeys.all, 'detail'] as const,
    detail: (slug: string) => [...productKeys.details(), slug] as const,
};

/**
 * useProducts (Infinite Query Edition)
 * Standardizes the "Reveal More" experience with stable signed cursors.
 *
 * Shape contract:
 *   - queryFn returns ApiResponse<PaginatedResponse<Product>>
 *   - ApiResponse.data is the PaginatedResponse — access via lastPage.data
 *   - PaginatedResponse.items is the product array
 *   - PaginatedResponse.meta contains hasNext, nextCursor, etc.
 */
export function useProducts(params?: ProductParams) {
    const { search, limit = 12, ...rest } = params || {};

    return useInfiniteQuery<PaginatedResponse<Product>>({
        // Stable key including all filters — changing any filter resets the query
        queryKey: [...productKeys.lists(), JSON.stringify({ search, limit, ...rest })],

        queryFn: ({ pageParam, signal }) => {
            // pageParam is either a cursor string (pages 2+) or a page number (page 1)
            const isCursor = typeof pageParam === 'string';
            return productApi.getAll({
                ...params,
                cursor: isCursor ? pageParam : undefined,
                page: !isCursor ? (pageParam as number ?? 1) : undefined,
                limit,
            }, signal).then((res) => res.data); // unwrap ApiResponse<PaginatedResponse>
        },

        initialPageParam: 1 as number | string,

        getNextPageParam: (lastPage) => {
            const meta = lastPage?.meta;
            if (!meta) return undefined;

            // P1-7 FIX: Guard against race where filter change triggers nextPage before
            // the first page has resolved: only follow cursor/page if meta is present.

            // Strategy 1: Cursor-based (preferred — O(log N) vs offset O(N))
            // This is sent from page 1 onward so the FE never issues OFFSET > 1 page deep.
            if (meta.nextCursor) return meta.nextCursor;

            // Strategy 2: Offset-based fallback (only for page 1 with no cursor yet)
            if (meta.hasNext && meta.page != null) return meta.page + 1;

            return undefined; // No more pages — "end of list"
        },

        staleTime: 1000 * 60 * 5, // 5-minute cache — reuse between filter-free navigations
    });
}


/**
 * useProduct (Detail View)
 */
export function useProduct(slug: string) {
    return useQuery({
        queryKey: [...productKeys.detail(slug || 'none')],
        queryFn: ({ signal }) => productApi.getBySlug(slug, signal),
        enabled: !!slug,
        staleTime: 1000 * 60 * 5,
    });
}
