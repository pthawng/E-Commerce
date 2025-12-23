import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { getProducts } from '../services/get-products';
import { getProduct } from '../services/get-product';
import { createProduct, type CreateProductDTO } from '../services/create-product';
import { updateProduct, type UpdateProductDTO } from '../services/update-product';
import { deleteProduct } from '../services/delete-product';
import {
    getVariants,
    createVariant as createVariantApi,
    updateVariant as updateVariantApi,
    deleteVariant as deleteVariantApi,
    type ProductVariant,
    type CreateVariantPayload,
    type UpdateVariantPayload,
} from '../services/variants';
import type { PaginationQuery } from '@shared';

export function useProducts(filters?: PaginationQuery) {
    return useQuery({
        queryKey: queryKeys.products.list(filters),
        queryFn: () => getProducts(filters),
    });
}

export function useProduct(id: string) {
    return useQuery({
        queryKey: queryKeys.products.detail(id),
        queryFn: () => getProduct(id),
        enabled: !!id,
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (args: { data: CreateProductDTO; images?: File[] }) =>
            createProduct(args.data, args.images),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
        },
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (args: { id: string; data: UpdateProductDTO; images?: File[] }) =>
            updateProduct(args.id, args.data, args.images),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
        },
    });
}

export function useDeleteProductMedia() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ productId, mediaId }: { productId: string; mediaId: string }) => {
            // TODO: Implement actual API call when backend endpoint is ready
            // For now, just invalidate queries
            console.log('Delete media:', productId, mediaId);
            return Promise.resolve();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.productId) });
        },
    });
}

export function useSetProductThumbnail() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ productId, mediaId }: { productId: string; mediaId: string }) => {
            // TODO: Implement actual API call when backend endpoint is ready
            // For now, just invalidate queries
            console.log('Set thumbnail:', productId, mediaId);
            return Promise.resolve();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.productId) });
        },
    });
}

export function useVariants(productId: string | null) {
    return useQuery({
        queryKey: productId ? ['product', productId, 'variants'] : ['product', 'variants', 'idle'],
        queryFn: () => getVariants(productId as string),
        enabled: !!productId,
    });
}

export function useCreateVariant(productId: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateVariantPayload) =>
            createVariantApi(productId as string, payload),
        onSuccess: () => {
            if (productId) {
                queryClient.invalidateQueries({ queryKey: ['product', productId, 'variants'] });
                queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
            }
        },
    });
}

export function useUpdateVariant(productId: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (args: { id: string; payload: UpdateVariantPayload }) =>
            updateVariantApi(productId as string, args.id, args.payload),
        onSuccess: (_, variables) => {
            if (productId) {
                queryClient.invalidateQueries({ queryKey: ['product', productId, 'variants'] });
                queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
            }
        },
    });
}

export function useDeleteVariant(productId: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteVariantApi(productId as string, id),
        onSuccess: () => {
            if (productId) {
                queryClient.invalidateQueries({ queryKey: ['product', productId, 'variants'] });
                queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
            }
        },
    });
}
