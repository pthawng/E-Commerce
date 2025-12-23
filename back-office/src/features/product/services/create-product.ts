import { apiPost, apiPostFormData } from '@/services/apiClient';
import type { Product } from '@shared';
import { API_ENDPOINTS } from '@shared';

export interface ProductVariantInput {
    sku?: string;
    price?: number;
    compareAtPrice?: number;
    costPrice?: number;
    weightGram?: number;
    variantTitle?: Record<string, string> | null;
    isDefault?: boolean;
    isActive?: boolean;
    position?: number;
}

export type CreateProductDTO = {
    name: Record<string, string>;
    description?: Record<string, string>;
    slug?: string;
    categoryIds?: string[];
    hasVariants?: boolean;
    isActive?: boolean;
    isFeatured?: boolean;
    mediaUrls?: string[];
    // simple product path
    basePrice?: number;
    baseCompareAtPrice?: number;
    baseCostPrice?: number;
    baseWeightGram?: number;
    baseVariantTitle?: Record<string, string> | null;
    // variant path (UI sẽ bổ sung sau)
    variants?: ProductVariantInput[];
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

        const response = await apiPostFormData<Product>(API_ENDPOINTS.PRODUCTS.BASE, formData);
        return response.data;
    } else {
        // JSON Payload
        const response = await apiPost<Product>(API_ENDPOINTS.PRODUCTS.BASE, data);
        return response.data;
    }
}
