import { apiDelete, apiGet, apiPost, apiPatch } from '@/services/apiClient';
import { API_ENDPOINTS } from '@shared';

export interface ProductVariant {
    id: string;
    sku: string;
    price: number;
    compareAtPrice?: number | null;
    costPrice?: number | null;
    weightGram?: number | null;
    isDefault: boolean;
    isActive: boolean;
}

export interface CreateVariantPayload {
    sku?: string;
    price: number;
    compareAtPrice?: number;
    costPrice?: number;
    weightGram?: number;
    isDefault?: boolean;
    isActive?: boolean;
    mediaIndexes?: number[];
}

export interface UpdateVariantPayload extends Partial<CreateVariantPayload> {
    productId?: string;
}

export async function getVariants(productId: string) {
    const url = `${API_ENDPOINTS.PRODUCTS.BY_ID(productId)}/variants`;
    const res = await apiGet<ProductVariant[]>(url);
    return res.data;
}

export async function createVariant(productId: string, payload: CreateVariantPayload) {
    const url = `${API_ENDPOINTS.PRODUCTS.BY_ID(productId)}/variants`;
    const res = await apiPost<ProductVariant>(url, payload);
    return res.data;
}

export async function updateVariant(
    productId: string,
    variantId: string,
    payload: UpdateVariantPayload,
) {
    const url = `${API_ENDPOINTS.PRODUCTS.BY_ID(productId)}/variants/${variantId}`;
    const res = await apiPatch<ProductVariant>(url, payload);
    return res.data;
}

export async function deleteVariant(productId: string, variantId: string) {
    const url = `${API_ENDPOINTS.PRODUCTS.BY_ID(productId)}/variants/${variantId}`;
    const res = await apiDelete<{ message: string }>(url);
    return res.data;
}


