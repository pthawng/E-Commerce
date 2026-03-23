import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../api/product.api';
import { productKeys } from './queries';
import { message } from 'antd';
import type { Product } from '@ecommerce/shared';
import type { UpdateProductDTO } from './schema';

/**
 * Mutation for creating a product
 */
export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productApi.createProduct,
        onSuccess: () => {
            void message.success('Product created successfully');
            void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
        },
    });
};

/**
 * Mutation for updating a product
 * Automatically invalidates detail and lists caches
 */
export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateProductDTO }) => 
            productApi.updateProduct(id, data),
        onSuccess: (product: Product) => {
            if (product) {
                void message.success('Product updated successfully');
                void queryClient.invalidateQueries({ queryKey: productKeys.details(product.id) });
                void queryClient.invalidateQueries({ queryKey: productKeys.details(product.slug) });
            }
            void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
        },
    });
};

/**
 * Mutation for deleting a product
 */
export const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productApi.deleteProduct,
        onSuccess: () => {
            void message.success('Product deleted successfully');
            void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
        },
    });
};

/**
 * Variant Mutations
 */
export const useCreateVariant = (productId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => productApi.createVariant(productId, data),
        onSuccess: () => {
            void message.success('Variant created');
            void queryClient.invalidateQueries({ queryKey: productKeys.details(productId) });
            // If there's a specific variants key in queries.ts, invalidate it too
        },
    });
};

export const useUpdateVariant = (productId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ variantId, data }: { variantId: string; data: any }) => 
            productApi.updateVariant(productId, variantId, data),
        onSuccess: () => {
            void message.success('Variant updated');
            void queryClient.invalidateQueries({ queryKey: productKeys.details(productId) });
        },
    });
};

export const useDeleteVariant = (productId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variantId: string) => productApi.deleteVariant(productId, variantId),
        onSuccess: () => {
            void message.success('Variant deleted');
            void queryClient.invalidateQueries({ queryKey: productKeys.details(productId) });
        },
    });
};
