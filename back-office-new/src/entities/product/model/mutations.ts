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
