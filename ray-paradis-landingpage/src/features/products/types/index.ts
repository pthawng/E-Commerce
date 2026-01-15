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

export interface ProductVariant {
    id: string;
    sku: string;
    price: number;
    compareAtPrice?: number;
    variantTitle: any;
    isDefault: boolean;
    attributes: any[];
    media: ProductMedia[];
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
    basePrice?: number;
    baseCompareAtPrice?: number;
    hasVariants: boolean;
    isActive: boolean;
    isFeatured: boolean;
    variants: ProductVariant[];
    media: ProductMedia[];
    categories: { category: Category }[];
    createdAt: string;
    updatedAt: string;
}

export interface ProductResponse {
    data: Product[];
    meta: {
        page: number;
        take: number;
        itemCount: number;
        pageCount: number;
        hasPreviousPage: boolean;
        hasNextPage: boolean;
    };
}

export interface ProductParams {
    page?: number;
    take?: number;
    search?: string;
    sort?: string;
    categoryId?: string;
}
