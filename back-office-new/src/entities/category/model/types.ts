import type { Multilingual } from '@ecommerce/shared';

export interface Category {
    id: string;
    name: Multilingual; // Record<string, string>
    slug: string;
    parentId: string | null;
    isActive: boolean;
    order: number;
    createdAt: string;
    children?: Category[];
    _count?: { products: number };
}

export interface CreateCategoryDTO {
    name: Multilingual;
    slug?: string;
    parentId?: string | null;
    order?: number;
    isActive?: boolean;
}

export type UpdateCategoryDTO = Partial<CreateCategoryDTO>;

export interface CategoryFilters {
    search?: string;
    isActive?: boolean;
}
