import { apiPatch, apiPatchFormData } from '@/services/apiClient';
import type { Product } from '@shared';
import { API_ENDPOINTS } from '@shared';
import type { CreateProductDTO } from './create-product';

export type UpdateProductDTO = Partial<CreateProductDTO> & {
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
        if (data.basePrice !== undefined) formData.append('basePrice', String(data.basePrice));
        if (data.baseCompareAtPrice !== undefined) {
            formData.append('baseCompareAtPrice', String(data.baseCompareAtPrice));
        }
        if (data.baseCostPrice !== undefined) formData.append('baseCostPrice', String(data.baseCostPrice));
        if (data.baseWeightGram !== undefined) {
            formData.append('baseWeightGram', String(data.baseWeightGram));
        }
        if (data.baseVariantTitle) {
            formData.append('baseVariantTitle', JSON.stringify(data.baseVariantTitle));
        }

        images.forEach((image) => formData.append('images', image));

        const response = await apiPatchFormData<Product>(API_ENDPOINTS.PRODUCTS.BY_ID(id), formData);
        return response.data;
    } else {
        const response = await apiPatch<Product>(API_ENDPOINTS.PRODUCTS.BY_ID(id), data);
        return response.data;
    }
}
