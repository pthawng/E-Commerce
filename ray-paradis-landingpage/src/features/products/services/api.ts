import { apiGet } from '@/services/apiClient';
import { Product, ProductParams, ProductResponse } from '../types';
import { API_ENDPOINTS } from '@shared';

const PRODUCT_ENDPOINT = '/products'; // Hardcoded for now if shared constant is missing or to override

export const productApi = {
    getAll: async (params?: ProductParams) => {
        // Construct query string manually or use apiClient's params handling if robust
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.take) searchParams.append('take', params.take.toString());
        if (params?.search) searchParams.append('search', params.search);
        if (params?.sort) searchParams.append('order', params.sort); // Backend uses 'order' for sorting direction/field combination usually, simplified here

        const queryString = searchParams.toString();
        const url = queryString ? `${PRODUCT_ENDPOINT}?${queryString}` : PRODUCT_ENDPOINT;

        return apiGet<ProductResponse>(url);
    },

    getBySlug: async (slug: string) => {
        return apiGet<Product>(`${PRODUCT_ENDPOINT}/slug/${slug}`);
    },

    getById: async (id: string) => {
        return apiGet<Product>(`${PRODUCT_ENDPOINT}/${id}`);
    }
};
