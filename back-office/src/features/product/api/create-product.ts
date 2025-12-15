import { apiPost, apiPostFormData } from '@/shared/api/api-client';
import type { Product } from '@shared';
import { API_ENDPOINTS } from '@shared';

export type CreateProductDTO = Partial<Product> & {
    categoryIds?: string[];
};

export async function createProduct(data: CreateProductDTO, images?: File[]) {
    if (images && images.length > 0) {
        const formData = new FormData();
        // Helper to append JSON fields
        if (data.name) formData.append('name', JSON.stringify(data.name));
        if (data.description) formData.append('description', JSON.stringify(data.description));
        if (data.slug) formData.append('slug', data.slug);
        if (data.categoryIds) {
            data.categoryIds.forEach((id) => formData.append('categoryIds', id));
        }
        if (data.hasVariants !== undefined) formData.append('hasVariants', String(data.hasVariants));
        if (data.isActive !== undefined) formData.append('isActive', String(data.isActive));
        if (data.isFeatured !== undefined) formData.append('isFeatured', String(data.isFeatured));

        images.forEach((image) => formData.append('images', image));

        const response = await apiPostFormData<Product>(API_ENDPOINTS.PRODUCTS.BASE, formData);
        return response.data;
    } else {
        // JSON Payload
        const response = await apiPost<Product>(API_ENDPOINTS.PRODUCTS.BASE, data);
        return response.data;
    }
}
