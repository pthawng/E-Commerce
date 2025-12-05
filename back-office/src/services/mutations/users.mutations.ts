/**
 * Users Mutations
 * TanStack Query mutation hooks cho user management
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiPost, apiPut, apiDelete } from '../apiClient';
import type { User } from '@shared/types';
import { API_ENDPOINTS } from '@shared/config';

/**
 * Create user mutation
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await apiPost<User>(API_ENDPOINTS.USERS.BASE, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

/**
 * Update user mutation
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const response = await apiPut<User>(API_ENDPOINTS.USERS.BY_ID(id), data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific user and list
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

/**
 * Delete user mutation
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiDelete<void>(API_ENDPOINTS.USERS.BY_ID(id));
      return response.data;
    },
    onSuccess: () => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

