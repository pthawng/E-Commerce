import axiosClient from '@/shared/api/axiosClient';
import type { ApiResponse, PaginatedResponse } from '@ecommerce/shared';
import type { Product, ProductFilters } from '../model/types';
import type { CreateProductDTO, UpdateProductDTO } from '../model/schema';

export const productApi = {
    /**
     * Get paginated list of products with filters
     */
    getProducts: async (params?: ProductFilters) => {
        return axiosClient.get<any, ApiResponse<PaginatedResponse<Product>>>('/admin/products', { params });
    },

    /**
     * Get single product by ID or Slug
     */
    getProduct: async (idOrSlug: string) => {
        return axiosClient.get<any, ApiResponse<Product>>(`/admin/products/${idOrSlug}`);
    },

    /**
     * Create new product
     */
    createProduct: async (data: CreateProductDTO) => {
        return axiosClient.post<any, ApiResponse<Product>>('/admin/products', data);
    },

    /**
     * Update existing product
     */
    updateProduct: async (id: string, data: UpdateProductDTO) => {
        return axiosClient.put<any, ApiResponse<Product>>(`/admin/products/${id}`, data);
    },

    /**
     * Delete product (soft or hard depending on BE)
     */
    deleteProduct: async (id: string) => {
        return axiosClient.delete<any, ApiResponse<void>>(`/admin/products/${id}`);
    }
};
