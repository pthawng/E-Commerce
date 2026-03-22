import type { 
    Product as SharedProduct, 
    ProductVariant as SharedProductVariant,
    ProductSummary as SharedProductSummary,
    PaginationQuery
} from '@ecommerce/shared';

export type Product = SharedProduct;
export type ProductVariant = SharedProductVariant;
export type ProductSummary = SharedProductSummary;

export interface ProductFilters extends PaginationQuery {
    categoryId?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    minPrice?: number;
    maxPrice?: number;
}

export type ProductSortField = 'name' | 'createdAt' | 'displayPriceMin' | 'displayPriceMax';
export type ProductSortOrder = 'asc' | 'desc';
