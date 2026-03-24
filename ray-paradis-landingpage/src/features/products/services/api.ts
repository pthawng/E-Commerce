import { apiGet } from '@/services/apiClient';
import { Product, ProductParams, ProductResponse } from '../types';
import { API_ENDPOINTS, ApiResponse } from '@shared';

const PRODUCT_ENDPOINT = API_ENDPOINTS.PRODUCTS.BASE;

export const productApi = {
    getAll: async (params?: ProductParams) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.search) searchParams.append('search', params.search);
        if (params?.sort) searchParams.append('sort', params.sort);
        if (params?.categoryId) searchParams.append('categoryId', params.categoryId);
        if (params?.isFeatured !== undefined) searchParams.append('isFeatured', params.isFeatured.toString());

        const queryString = searchParams.toString();
        const url = queryString ? `${PRODUCT_ENDPOINT}?${queryString}` : PRODUCT_ENDPOINT;

        return apiGet<Product[]>(url); // apiGet returns ApiResponse<T>, so we specify the data type T
    },

    getBySlug: async (slug: string) => {
        const url = API_ENDPOINTS.PRODUCTS.BY_SLUG(slug);
        const res = await apiGet<Product>(url);
        return res.data; // useProducts expects the product directly
    },

    getById: async (id: string) => {
        const url = API_ENDPOINTS.PRODUCTS.BY_ID(id);
        const res = await apiGet<Product>(url);
        return res.data;
    }
};
