import { useQuery } from '@tanstack/react-query';
import { productApi } from '../services/api';
import { ProductParams } from '../types';

export const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (filters: ProductParams) => [...productKeys.lists(), filters] as const,
    details: () => [...productKeys.all, 'detail'] as const,
    detail: (slug: string) => [...productKeys.details(), slug] as const,
};

export function useProducts(params?: ProductParams) {
    return useQuery({
        // Senior fix: stringify params as part of the key to ensure stability even if a new object is passed
        queryKey: [...productKeys.lists(), JSON.stringify(params || {})],
        queryFn: () => productApi.getAll(params),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useProduct(slug: string) {
    return useQuery({
        // Senior fix: ensure key is perfectly stable
        queryKey: [...productKeys.detail(slug || 'none')],
        queryFn: () => productApi.getBySlug(slug),
        enabled: !!slug,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
