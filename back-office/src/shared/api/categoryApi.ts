import api from './apiInstance';

// ============================================
// CATEGORY TYPES
// ============================================

export interface CategoryTreeNode {
    id: string;
    parentId: string | null;
    name: Record<string, string>;
    slug: string;
    isActive: boolean;
    order: number;
    path: string | null;
    level: number | null;
    children: CategoryTreeNode[];
}

export interface CategoryDetail {
    id: string;
    parentId: string | null;
    name: Record<string, string>;
    slug: string;
    isActive: boolean;
    order: number;
    path: string | null;
    level: number | null;
    parent?: CategoryTreeNode | null;
    children?: CategoryTreeNode[];
}

export interface CreateCategoryPayload {
    name: Record<string, string>;
    slug?: string;
    parentId?: string | null;
    isActive?: boolean;
    order?: number;
}

export interface UpdateCategoryPayload {
    name?: Record<string, string>;
    slug?: string;
    parentId?: string | null;
    isActive?: boolean;
    order?: number;
}

// ============================================
// API METHODS
// ============================================

export const categoryApi = {
    getTree: (includeInactive = true) =>
        api.get<CategoryTreeNode[]>('/categories', { params: { includeInactive } }).then(res => res.data),

    getById: (id: string) =>
        api.get<CategoryDetail>(`/categories/${id}`).then(res => res.data),

    getBySlug: (slug: string) =>
        api.get<CategoryDetail>(`/categories/slug/${slug}`).then(res => res.data),

    create: (data: CreateCategoryPayload) =>
        api.post<CategoryDetail>('/categories', data).then(res => res.data),

    update: (id: string, data: UpdateCategoryPayload) =>
        api.patch<CategoryDetail>(`/categories/${id}`, data).then(res => res.data),

    delete: (id: string) =>
        api.delete(`/categories/${id}`).then(res => res.data),
};
