import { apiGet } from '@/services/apiClient';
import { Product, ProductParams } from '../types';
import { API_ENDPOINTS } from '@shared';
import type { PaginationMeta, PaginationLinks } from '@/types/pagination';

export interface PaginatedResponse<T> {
    items: T[];
    meta: PaginationMeta;
    links: PaginationLinks;
    data: T[]; // some API consumers use .data — aliased for backward compat
}

const PRODUCT_ENDPOINT = API_ENDPOINTS.PRODUCTS.BASE;

export const productApi = {
    getAll: async (params?: ProductParams, signal?: AbortSignal) => {
        const searchParams = new URLSearchParams();

        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.cursor) searchParams.append('cursor', params.cursor); // NEW: Cursor support
        if (params?.search) searchParams.append('search', params.search);
        if (params?.sort) searchParams.append('sort', params.sort);
        if (params?.categoryId) searchParams.append('categoryId', params.categoryId);
        if (params?.isFeatured !== undefined) searchParams.append('isFeatured', params.isFeatured.toString());

        const queryString = searchParams.toString();
        const url = queryString ? `${PRODUCT_ENDPOINT}?${queryString}` : PRODUCT_ENDPOINT;

        // P1-6 FIX: Return type is now PaginatedResponse<Product>, not Product[].
        // Previously typed as Product[] which is a lie — the API returns { items, meta, links }.
        // This causes getNextPageParam to receive undefined meta and breaks infinite scroll.
        return apiGet<PaginatedResponse<Product>>(url, { signal });
    },

    getBySlug: async (slug: string, signal?: AbortSignal) => {
        const url = API_ENDPOINTS.PRODUCTS.BY_SLUG(slug);
        const res = await apiGet<Product>(url, { signal });
        return res.data;
    },

    getById: async (id: string, signal?: AbortSignal) => {
        const url = API_ENDPOINTS.PRODUCTS.BY_ID(id);
        const res = await apiGet<Product>(url, { signal });
        return res.data;
    }
};
