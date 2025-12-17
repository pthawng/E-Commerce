import { apiPatch, apiPatchFormData } from '@/services/apiClient';
import type { Product } from '@shared';
import { API_ENDPOINTS } from '@shared';

export type UpdateProductDTO = Partial<Product> & {
    categoryIds?: string[];
};

export async function updateProduct(id: string, data: UpdateProductDTO, images?: File[]) {
    if (images && images.length > 0) {
        const formData = new FormData();
        if (data.name) formData.append('name', JSON.stringify(data.name));
        if (data.description) formData.append('description', JSON.stringify(data.description));
        if (data.slug) formData.append('slug', data.slug);
        if (data.categoryIds) {
            data.categoryIds.forEach((catId) => formData.append('categoryIds', catId));
        }
        if (data.hasVariants !== undefined) formData.append('hasVariants', String(data.hasVariants));
        if (data.isActive !== undefined) formData.append('isActive', String(data.isActive));
        if (data.isFeatured !== undefined) formData.append('isFeatured', String(data.isFeatured));

        images.forEach((image) => formData.append('images', image));

        const response = await apiPatchFormData<Product>(API_ENDPOINTS.PRODUCTS.BY_ID(id), formData);
        return response.data;
    } else {
        const response = await apiPatch<Product>(API_ENDPOINTS.PRODUCTS.BY_ID(id), data);
        return response.data;
    }
}
