/**
 * Categories Mutations
 * TanStack Query mutation hooks cho category management
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiPost, apiPatch, apiDelete } from '../apiClient';
import type { Category } from '@shared';
import { API_ENDPOINTS } from '@shared';

/**
 * Create category mutation
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: Record<string, string>;
      slug?: string;
      parentId?: string | null;
      order?: number;
      isActive?: boolean;
    }) => {
      const response = await apiPost<Category>(API_ENDPOINTS.CATEGORIES.BASE, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });
    },
  });
}

/**
 * Update category mutation
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: Record<string, string>;
        slug?: string;
        parentId?: string | null;
        order?: number;
        isActive?: boolean;
      };
    }) => {
      const response = await apiPatch<Category>(API_ENDPOINTS.CATEGORIES.BY_ID(id), data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });
    },
  });
}

/**
 * Delete category mutation
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiDelete<void>(API_ENDPOINTS.CATEGORIES.BY_ID(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });
    },
  });
}

