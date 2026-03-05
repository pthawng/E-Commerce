export interface ProductMedia {
    id: string;
    url: string;
    type: string;
    order: number;
    isThumbnail: boolean;
}

/** One row from the ProductCategory junction table */
export interface ProductCategoryJunction {
    category: {
        id: string;
        name: Record<string, string>;
        slug: string;
    };
}

export interface ProductVariant {
    id: string;
    productId: string;
    sku: string;
    price: number;
    compareAtPrice: number | null;
    costPrice: number | null;
    weightGram: number | null;
    variantTitle: Record<string, string> | null;
    isDefault: boolean;
    isActive: boolean;
    position: number;
    attributeValues?: { id: string; value: Record<string, string>; metaValue: string | null }[];
}

export interface Product {
    id: string;
    name: Record<string, string>;
    slug: string;
    description: Record<string, string> | null;
    isActive: boolean;
    isFeatured: boolean;
    hasVariants: boolean;
    createdAt: string;
    updatedAt: string;
    /** Junction rows — backend returns {category: {...}} not flat Category[] */
    categories?: ProductCategoryJunction[];
    variants?: ProductVariant[];
    media?: ProductMedia[];
    _count?: { variants: number };
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface PaginatedProducts {
    items: Product[];
    meta: PaginationMeta;
    links?: Record<string, string | null>;
}

export interface CreateProductDTO {
    name: Record<string, string>;
    slug?: string;
    description?: Record<string, string>;
    categoryIds?: string[];
    hasVariants?: boolean;
    isActive?: boolean;
    isFeatured?: boolean;
    basePrice?: number;
    baseCompareAtPrice?: number;
    baseCostPrice?: number;
    baseWeightGram?: number;
}

export type UpdateProductDTO = Partial<CreateProductDTO>;

export interface CreateVariantDTO {
    sku?: string;
    price: number;
    compareAtPrice?: number;
    costPrice?: number;
    weightGram?: number;
    variantTitle?: Record<string, string>;
    isDefault?: boolean;
    isActive?: boolean;
    position?: number;
    attributeValueIds?: string[];
}

export type UpdateVariantDTO = Partial<CreateVariantDTO>;
