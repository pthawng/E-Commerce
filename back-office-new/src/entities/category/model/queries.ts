import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../api/category.api';
import { message } from 'antd';
import type { Category, CategoryFilters } from './types';

/**
 * Scalable Query Key Factory for Categories
 */
export const categoryKeys = {
    all: ['categories'] as const,
    lists: (filters?: CategoryFilters) => [...categoryKeys.all, 'list', filters] as const,
    details: (id: string) => [...categoryKeys.all, 'detail', id] as const,
};

/**
 * Hook for fetching category tree
 */
export const useCategoryTree = () => {
    return useQuery({
        queryKey: categoryKeys.lists(),
        queryFn: categoryApi.getTree,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook for single category
 */
export const useCategory = (id: string | null) => {
    return useQuery({
        queryKey: categoryKeys.details(id || ''),
        queryFn: () => categoryApi.getCategory(id!),
        enabled: !!id,
    });
};

/**
 * Mutation for creating category
 */
export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: categoryApi.createCategory,
        onSuccess: () => {
            void message.success('Category created');
            void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
        },
    });
};

/**
 * Mutation for updating category
 */
export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => categoryApi.updateCategory(id, data),
        onSuccess: (category: Category) => {
            void message.success('Category updated');
            void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
        },
    });
};

/**
 * Mutation for deleting category
 */
export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: categoryApi.deleteCategory,
        onSuccess: () => {
            void message.success('Category deleted');
            void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
        },
    });
};
