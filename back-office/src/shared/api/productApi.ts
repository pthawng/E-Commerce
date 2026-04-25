import api from './apiInstance';
import { PaginatedResponse } from './orderApi';

// ============================================
// PRODUCT TYPES
// ============================================

export interface ProductListItem {
    id: string;
    name: Record<string, string>;
    slug: string;
    description?: Record<string, string>;
    displayPriceMin: number | null;
    displayPriceMax: number | null;
    hasVariants: boolean;
    isActive: boolean;
    isFeatured: boolean;
    createdAt: string;
    updatedAt: string;
    variants: ProductVariantSummary[];
    media: ProductMedia[];
    categories: Array<{ categoryId: string; category: CategoryItem }>;
}

export interface ProductVariantSummary {
    id: string;
    sku: string;
    price: number;
    compareAtPrice?: number;
    costPrice?: number;
    weightGram?: number;
    variantTitle: Record<string, any> | null;
    isDefault: boolean;
    isActive: boolean;
    position: number;
}

export interface ProductDetail extends ProductListItem {
    variants: Array<ProductVariantSummary & {
        attributes: Array<{
            attributeValueId: string;
            attributeValue: {
                id: string;
                value: Record<string, string>;
                metaValue?: string;
                attribute: {
                    id: string;
                    code: string;
                    name: Record<string, string>;
                };
            };
        }>;
    }>;
}

export interface ProductMedia {
    id: string;
    url: string;
    type: 'image' | 'video' | 'model_3d';
    altText?: Record<string, string>;
    isThumbnail: boolean;
    order: number;
}

export interface CategoryItem {
    id: string;
    name: Record<string, string>;
    slug: string;
    isActive: boolean;
    order: number;
    path?: string;
    level?: number;
}

export interface CreateProductPayload {
    name: Record<string, string>;
    slug?: string;
    description?: Record<string, string>;
    categoryIds?: string[];
    hasVariants?: boolean;
    isActive?: boolean;
    isFeatured?: boolean;
    mediaUrls?: string[];
    variants?: Array<{
        sku?: string;
        price: number;
        compareAtPrice?: number;
        costPrice?: number;
        weightGram?: number;
        variantTitle?: Record<string, any>;
        isDefault?: boolean;
        isActive?: boolean;
        position?: number;
        attributeValueIds?: string[];
        mediaIndexes?: number[];
    }>;
    basePrice?: number;
    baseCompareAtPrice?: number;
    baseCostPrice?: number;
    baseWeightGram?: number;
    baseVariantTitle?: Record<string, any>;
}

export interface UpdateProductPayload {
    name?: Record<string, string>;
    slug?: string;
    description?: Record<string, string>;
    categoryIds?: string[];
    hasVariants?: boolean;
    isActive?: boolean;
    isFeatured?: boolean;
}

export interface ProductQueryParams {
    page?: number;
    limit?: number;
    sort?: string;
    search?: string;
    categoryId?: string;
    isFeatured?: boolean;
    isActive?: boolean;
}

// ============================================
// API METHODS
// ============================================

export const productApi = {
    getProducts: (params?: ProductQueryParams) =>
        api.get<PaginatedResponse<ProductListItem>>('/products', { params }).then(res => res.data),

    getProduct: (id: string) =>
        api.get<ProductDetail>(`/products/${id}`).then(res => res.data),

    getProductBySlug: (slug: string) =>
        api.get<ProductDetail>(`/products/slug/${slug}`).then(res => res.data),

    createProduct: (data: CreateProductPayload) =>
        api.post<ProductDetail>('/products', data).then(res => res.data),

    updateProduct: (id: string, data: UpdateProductPayload) =>
        api.patch<ProductDetail>(`/products/${id}`, data).then(res => res.data),

    // Media
    uploadMedia: (productId: string, file: File, options?: { isThumbnail?: boolean; order?: number }) => {
        const formData = new FormData();
        formData.append('file', file);
        if (options?.isThumbnail !== undefined) formData.append('isThumbnail', String(options.isThumbnail));
        if (options?.order !== undefined) formData.append('order', String(options.order));
        return api.post<ProductMedia>(`/products/${productId}/media`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(res => res.data);
    },

    deleteMedia: (productId: string, mediaId: string) =>
        api.delete(`/products/${productId}/media/${mediaId}`),

    setThumbnail: (productId: string, mediaId: string) =>
        api.patch(`/products/${productId}/media/${mediaId}/thumbnail`),
};
