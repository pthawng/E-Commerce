import axiosClient from '@/shared/api/axiosClient';
import type { ApiResponse } from '@ecommerce/shared';
import type {
    Product, ProductVariant, PaginatedProducts,
    CreateProductDTO, UpdateProductDTO,
    CreateVariantDTO, UpdateVariantDTO,
} from '../types';

function unwrap<T>(envelope: unknown): T {
    return (envelope as ApiResponse<T>).data as T;
}

export const productApi = {
    // ── Products ─────────────────────────────────────────────────────────────

    /** GET /products?page=&limit=&search= */
    getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedProducts> => {
        const env = await axiosClient.get('/products', { params }) as any;
        // Interceptor flattens: data is items, meta is sibling
        return {
            items: env.data,
            meta: env.meta
        };
    },

    /** GET /products/:id */
    getOne: async (id: string): Promise<Product> => {
        const env = await axiosClient.get(`/products/${id}`);
        return unwrap<Product>(env);
    },

    /**
     * POST /products — multipart/form-data
     * Sends JSON fields + optional image files.
     */
    create: async (data: CreateProductDTO, images?: File[]): Promise<Product> => {
        const form = new FormData();
        // Multilingual JSON fields must be stringified for FormData
        form.append('name', JSON.stringify(data.name));
        if (data.description) form.append('description', JSON.stringify(data.description));
        if (data.slug) form.append('slug', data.slug);
        if (data.categoryIds) data.categoryIds.forEach((id) => form.append('categoryIds', id));
        if (data.hasVariants !== undefined) form.append('hasVariants', String(data.hasVariants));
        if (data.isActive !== undefined) form.append('isActive', String(data.isActive));
        if (data.isFeatured !== undefined) form.append('isFeatured', String(data.isFeatured));
        if (data.basePrice !== undefined) form.append('basePrice', String(data.basePrice));
        if (data.baseCompareAtPrice !== undefined) form.append('baseCompareAtPrice', String(data.baseCompareAtPrice));
        images?.forEach((f) => form.append('images', f));

        const env = await axiosClient.post('/products', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return unwrap<Product>(env);
    },

    /**
     * PATCH /products/:id — multipart/form-data
     */
    update: async ({ id, data, images }: { id: string; data: UpdateProductDTO; images?: File[] }): Promise<Product> => {
        const form = new FormData();
        if (data.name) form.append('name', JSON.stringify(data.name));
        if (data.description) form.append('description', JSON.stringify(data.description));
        if (data.slug) form.append('slug', data.slug);
        if (data.categoryIds) data.categoryIds.forEach((cId) => form.append('categoryIds', cId));
        if (data.isActive !== undefined) form.append('isActive', String(data.isActive));
        if (data.isFeatured !== undefined) form.append('isFeatured', String(data.isFeatured));
        images?.forEach((f) => form.append('images', f));

        const env = await axiosClient.patch(`/products/${id}`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return unwrap<Product>(env);
    },

    // ── Variants ─────────────────────────────────────────────────────────────

    /** GET /products/:productId/variants */
    getVariants: async (productId: string): Promise<ProductVariant[]> => {
        const env = await axiosClient.get(`/products/${productId}/variants`);
        return unwrap<ProductVariant[]>(env);
    },

    /** POST /products/:productId/variants */
    createVariant: async ({ productId, data }: { productId: string; data: CreateVariantDTO }): Promise<ProductVariant> => {
        const env = await axiosClient.post(`/products/${productId}/variants`, data);
        return unwrap<ProductVariant>(env);
    },

    /** PATCH /products/:productId/variants/:variantId */
    updateVariant: async ({ productId, variantId, data }: { productId: string; variantId: string; data: UpdateVariantDTO }): Promise<ProductVariant> => {
        const env = await axiosClient.patch(`/products/${productId}/variants/${variantId}`, data);
        return unwrap<ProductVariant>(env);
    },

    /** DELETE /products/:productId/variants/:variantId */
    deleteVariant: async ({ productId, variantId }: { productId: string; variantId: string }): Promise<void> => {
        await axiosClient.delete(`/products/${productId}/variants/${variantId}`);
    },
};
