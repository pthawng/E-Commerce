export interface LocalizedString {
    vi: string;
    en: string;
    [key: string]: string;
}

export interface ProductMedia {
    id: string;
    url: string;
    type: string;
    isThumbnail: boolean;
    order: number;
}

export interface Attribute {
    id: string;
    code: string;
    name: LocalizedString;
}

export interface AttributeValue {
    id: string;
    value: LocalizedString;
    metaValue?: string;
    attribute: Attribute;
}

export interface VariantAttribute {
    attributeValue: AttributeValue;
}

export interface ProductVariant {
    id: string;
    sku: string;
    price: number;
    compareAtPrice?: number;
    variantTitle: any;
    isDefault: boolean;
    thumbnailUrl?: string;
    attributes: VariantAttribute[];
    media: ProductMedia[];
    stock?: number;
}

export interface Category {
    id: string;
    name: LocalizedString;
    slug: string;
}

export interface Product {
    id: string;
    name: LocalizedString;
    slug: string;
    description?: LocalizedString;
    displayPriceMin?: number;
    displayPriceMax?: number;
    isActive: boolean;
    isFeatured: boolean;
    variants: ProductVariant[];
    media: ProductMedia[];
    categories: { category: Category }[];
    createdAt: string;
    updatedAt: string;
}

import { ApiResponse } from '@shared';

export interface ProductResponse extends ApiResponse<Product[]> {}

export interface ProductParams {
    page?: number;
    limit?: number; // Backend uses 'limit' instead of 'take' in PaginationDto sometimes, or 'take' in TypeORM. Let's align with PaginationDto: 'limit'
    search?: string;
    sort?: string; // format: field:direction
    categoryId?: string;
    isFeatured?: boolean;
}
