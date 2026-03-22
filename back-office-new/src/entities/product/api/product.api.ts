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
        return axiosClient.get('/admin/products', { params });
    },

    /**
     * Get single product by ID or Slug
     */
    getProduct: async (idOrSlug: string): Promise<Product> => {
        return axiosClient.get(`/admin/products/${idOrSlug}`);
    },

    /**
     * Create new product
     */
    createProduct: async (data: CreateProductDTO): Promise<Product> => {
        return axiosClient.post('/admin/products', data);
    },

    /**
     * Update existing product
     */
    updateProduct: async (id: string, data: UpdateProductDTO): Promise<Product> => {
        return axiosClient.put(`/admin/products/${id}`, data);
    },

    /**
     * Delete product
     */
    deleteProduct: async (id: string): Promise<void> => {
        return axiosClient.delete(`/admin/products/${id}`);
    }
};
