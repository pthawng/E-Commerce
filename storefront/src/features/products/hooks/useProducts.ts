import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { productApi, type PaginatedResponse } from '../services/api';
import { Product, ProductParams } from '../types';

export const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (filters: ProductParams) => [...productKeys.lists(), filters] as const,
    details: () => [...productKeys.all, 'detail'] as const,
    detail: (slug: string) => [...productKeys.details(), slug] as const,
};

export function useProducts(params?: ProductParams) {
    const { search, limit = 12, enabled = true, ...rest } = params || {};

    return useInfiniteQuery<PaginatedResponse<Product>>({
        queryKey: [...productKeys.lists(), JSON.stringify({ search, limit, ...rest })],
        queryFn: ({ pageParam, signal }) => {
            const isCursor = typeof pageParam === 'string';
            return productApi.getAll({
                ...params,
                cursor: isCursor ? pageParam : undefined,
                page: !isCursor ? (pageParam as number ?? 1) : undefined,
                limit,
            }, signal).then((res) => res.data);
        },
        initialPageParam: 1 as number | string,
        getNextPageParam: (lastPage) => {
            const meta = lastPage?.meta;
            if (!meta) return undefined;
            if (meta.nextCursor) return meta.nextCursor;
            if (meta.hasNext && meta.page != null) return meta.page + 1;
            return undefined;
        },
        enabled,
        staleTime: 1000 * 60 * 5,
    });
}

export function useProduct(slug: string) {
    return useQuery({
        queryKey: [...productKeys.detail(slug || 'none')],
        queryFn: ({ signal }) => productApi.getBySlug(slug, signal),
        enabled: !!slug,
        staleTime: 1000 * 60 * 5,
    });
}
