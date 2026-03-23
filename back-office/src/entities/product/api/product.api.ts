import { api as axiosClient } from '@/shared/api/base';
import type { PaginatedResponse } from '@ecommerce/shared';
import type { Product, ProductFilters } from '../model/types';
import type { CreateProductDTO, UpdateProductDTO } from '../model/schema';

/**
 * Product API Service
 * Strongly typed calls using centralized Axios instance
 */
export const productApi = {
    /**
     * Get paginated list of products with filters
     */
    getProducts: async (params?: ProductFilters): Promise<PaginatedResponse<Product>> => {
        // Clear empty/undefined params to avoid 400 Bad Request on some backends
        const cleanParams = params ? Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        ) : undefined;
        
        return axiosClient.get('/products', { params: cleanParams });
    },

    /**
     * Get single product by ID or Slug
     */
    getProduct: async (idOrSlug: string): Promise<Product> => {
        return axiosClient.get(`/products/${idOrSlug}`);
    },

    /**
     * Create new product
     */
    createProduct: async (data: CreateProductDTO): Promise<Product> => {
        return axiosClient.post('/products', data);
    },

    /**
     * Update existing product
     */
    updateProduct: async (id: string, data: UpdateProductDTO): Promise<Product> => {
        return axiosClient.put(`/products/${id}`, data);
    },

    /**
     * Delete product
     */
    deleteProduct: async (id: string): Promise<void> => {
        return axiosClient.delete(`/products/${id}`);
    },

    /**
     * Variants API
     */
    getVariants: async (productId: string): Promise<any[]> => {
        return axiosClient.get(`/products/${productId}/variants`);
    },

    createVariant: async (productId: string, data: any): Promise<any> => {
        return axiosClient.post(`/products/${productId}/variants`, data);
    },

    updateVariant: async (productId: string, variantId: string, data: any): Promise<any> => {
        return axiosClient.put(`/products/${productId}/variants/${variantId}`, data);
    },

    deleteVariant: async (productId: string, variantId: string): Promise<void> => {
        return axiosClient.delete(`/products/${productId}/variants/${variantId}`);
    }
};
