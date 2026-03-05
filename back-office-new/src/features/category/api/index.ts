import axiosClient from '@/shared/api/axiosClient';
import type { ApiResponse } from '@ecommerce/shared';
import type { Category, CreateCategoryDTO, UpdateCategoryDTO } from '../types';

function unwrap<T>(envelope: unknown): T {
    return (envelope as ApiResponse<T>).data as T;
}

export const categoryApi = {
    /** GET /categories → Category[] (tree structure) */
    getTree: async (): Promise<Category[]> => {
        const envelope = await axiosClient.get('/categories');
        return unwrap<Category[]>(envelope);
    },

    /** GET /categories/:id → Category */
    getOne: async (id: string): Promise<Category> => {
        const envelope = await axiosClient.get(`/categories/${id}`);
        return unwrap<Category>(envelope);
    },

    /** POST /categories → Category */
    create: async (data: CreateCategoryDTO): Promise<Category> => {
        const envelope = await axiosClient.post('/categories', data);
        return unwrap<Category>(envelope);
    },

    /** PATCH /categories/:id → Category */
    update: async ({ id, data }: { id: string; data: UpdateCategoryDTO }): Promise<Category> => {
        const envelope = await axiosClient.patch(`/categories/${id}`, data);
        return unwrap<Category>(envelope);
    },

    /** DELETE /categories/:id */
    remove: async (id: string): Promise<void> => {
        await axiosClient.delete(`/categories/${id}`);
    },
};
