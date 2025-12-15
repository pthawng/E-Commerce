import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { getProducts } from '../api/get-products';
import { getProduct } from '../api/get-product';
import { createProduct, type CreateProductDTO } from '../api/create-product';
import { updateProduct, type UpdateProductDTO } from '../api/update-product';
import { deleteProduct } from '../api/delete-product';
import type { PaginationQuery } from '../model/types';

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
