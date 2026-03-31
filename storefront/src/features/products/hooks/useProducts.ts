import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { productApi } from '../services/api';
import { ProductParams } from '../types';

export const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (filters: ProductParams) => [...productKeys.lists(), filters] as const,
    details: () => [...productKeys.all, 'detail'] as const,
    detail: (slug: string) => [...productKeys.details(), slug] as const,
};

/**
 * useProducts (Infinite Query Edition)
 * Standardizes the "Reveal More" experience with stable cursors
 */
export function useProducts(params?: ProductParams) {
    const { search, limit = 12, ...rest } = params || {};
    
    return useInfiniteQuery({
        // Stable key including all filters
        queryKey: [...productKeys.lists(), JSON.stringify({ search, limit, ...rest })],
        
        queryFn: ({ pageParam, signal }) => {
            return productApi.getAll({ 
                ...params, 
                cursor: pageParam as string | undefined,
                limit 
            }, signal);
        },
        
        initialPageParam: undefined,
        
        getNextPageParam: (lastPage) => {
            // Extract the next cursor from backend metadata
            return lastPage.meta.nextCursor ?? undefined;
        },
        
        staleTime: 1000 * 60 * 5, // 5 minutes cache
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
