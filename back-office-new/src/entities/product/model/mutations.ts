import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../api/product.api';
import { productKeys } from './queries';
import { message } from 'antd';
import type { ApiResponse, Product } from '@ecommerce/shared';
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
 */
export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateProductDTO }) => 
            productApi.updateProduct(id, data),
        onSuccess: (response: ApiResponse<Product>) => {
            const product = response.data;
            if (product) {
                void message.success('Product updated successfully');
                void queryClient.invalidateQueries({ queryKey: productKeys.detail(product.id) });
                void queryClient.invalidateQueries({ queryKey: productKeys.detail(product.slug) });
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
