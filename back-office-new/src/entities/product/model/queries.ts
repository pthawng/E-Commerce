import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/product.api';
import type { ProductFilters } from './types';

/**
 * Scalable Query Key Factory for Products
 * Ensures consistent cache management across the app
 */
export const productKeys = {
    all: ['products'] as const,
    lists: (filters?: ProductFilters) => [...productKeys.all, 'list', filters] as const,
    details: (idOrSlug: string) => [...productKeys.all, 'detail', idOrSlug] as const,
};

/**
 * Hook for fetching paginated product list
 * Now returns Product[] directly thanks to interceptor unwrapping
 */
export const useProducts = (params: ProductFilters = {}) => {
    return useQuery({
        queryKey: productKeys.lists(params),
        queryFn: () => productApi.getProducts(params),
    });
};

/**
 * Hook for fetching a single product
 * Type-safe and cached by ID/Slug
 */
export const useProduct = (idOrSlug: string) => {
    return useQuery({
        queryKey: productKeys.details(idOrSlug),
        queryFn: () => productApi.getProduct(idOrSlug),
        enabled: !!idOrSlug,
    });
};
