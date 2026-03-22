import { api as axiosClient } from '@/shared/api/base';
import type { Category, CreateCategoryDTO, UpdateCategoryDTO } from '../model/types';

/**
 * Category API Service
 */
export const categoryApi = {
    /**
     * Get all categories in a tree structure
     */
    getTree: async (): Promise<Category[]> => {
        return axiosClient.get('/categories');
    },

    /**
     * Get category detail
     */
    getCategory: async (id: string): Promise<Category> => {
        return axiosClient.get(`/categories/${id}`);
    },

    /**
     * Create new category
     */
    createCategory: async (data: CreateCategoryDTO): Promise<Category> => {
        return axiosClient.post('/categories', data);
    },

    /**
     * Update existing category
     */
    updateCategory: async (id: string, data: UpdateCategoryDTO): Promise<Category> => {
        return axiosClient.patch(`/categories/${id}`, data);
    },

    /**
     * Delete category
     */
    deleteCategory: async (id: string): Promise<void> => {
        return axiosClient.delete(`/categories/${id}`);
    }
};
