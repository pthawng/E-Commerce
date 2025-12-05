/**
 * Product Types
 * Types cho Product entity - dùng chung giữa BE và FE
 */
import { MediaType } from '../enums';
/**
 * Product Media
 */
export interface ProductMedia {
    id: string;
    productId: string;
    url: string;
    type: MediaType;
    altText?: any;
    isThumbnail: boolean;
    order: number;
    createdAt: Date | string;
}
/**
 * Product Variant
 */
export interface ProductVariant {
    id: string;
    productId: string;
    sku: string;
    variantTitle?: any;
    price: number;
    compareAtPrice?: number;
    costPrice?: number;
    weightGram?: number;
    isDefault: boolean;
    isActive: boolean;
    position: number;
    createdAt: Date | string;
    updatedAt: Date | string;
}
/**
 * Product
 */
export interface Product {
    id: string;
    categoryId?: string;
    name: any;
    slug: string;
    description?: any;
    displayPriceMin?: number;
    displayPriceMax?: number;
    hasVariants: boolean;
    isActive: boolean;
    isFeatured: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    variants?: ProductVariant[];
    media?: ProductMedia[];
}
/**
 * Product Summary (cho list)
 */
export interface ProductSummary {
    id: string;
    name: any;
    slug: string;
    displayPriceMin?: number;
    displayPriceMax?: number;
    thumbnailUrl?: string;
    isActive: boolean;
    isFeatured: boolean;
}
/**
 * Category
 */
export interface Category {
    id: string;
    parentId?: string;
    name: any;
    slug: string;
    isActive: boolean;
    order: number;
    path?: string;
    children?: Category[];
}
//# sourceMappingURL=product.types.d.ts.map