// ─── Category Types ───────────────────────────────────────────────────────────

export interface Category {
    id: string;
    name: Record<string, string>;
    slug: string;
    parentId: string | null;
    isActive: boolean;
    order: number;
    createdAt: string;
    children?: Category[];
    _count?: { products: number };
}

export interface CreateCategoryDTO {
    name: Record<string, string>;
    slug?: string;
    parentId?: string | null;
    order?: number;
    isActive?: boolean;
}

export type UpdateCategoryDTO = Partial<CreateCategoryDTO>;
