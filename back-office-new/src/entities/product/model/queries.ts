import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/product.api';
import type { ProductFilters, Product } from './types';
import type { ApiResponse, PaginatedResponse } from '@ecommerce/shared';

/**
 * Scalable Query Key Factory for Products
 */
export const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (params: ProductFilters) => [...productKeys.lists(), params] as const,
    details: () => [...productKeys.all, 'detail'] as const,
    detail: (idOrSlug: string) => [...productKeys.details(), idOrSlug] as const,
};

/**
 * Hook for fetching paginated product list
 */
export const useProductList = (params: ProductFilters = {}) => {
    return useQuery({
        queryKey: productKeys.list(params),
        queryFn: () => productApi.getProducts(params),
        select: (response: ApiResponse<PaginatedResponse<Product>>) => response.data,
    });
};

/**
 * Hook for fetching a single product
 */
export const useProductDetail = (idOrSlug: string) => {
    return useQuery({
        queryKey: productKeys.detail(idOrSlug),
        queryFn: () => productApi.getProduct(idOrSlug),
        enabled: !!idOrSlug,
        select: (response: ApiResponse<Product>) => response.data,
    });
};
