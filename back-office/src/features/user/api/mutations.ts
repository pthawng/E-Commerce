import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiPost, apiPatch, apiDelete } from '@/shared/api/api-client';
import type { User } from '@shared';
import { API_ENDPOINTS } from '@shared';

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<User>) => {
            const response = await apiPost<User>(API_ENDPOINTS.USERS.BASE, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
            const response = await apiPatch<User>(API_ENDPOINTS.USERS.BY_ID(id), data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.users.detail(variables.id),
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiDelete<void>(API_ENDPOINTS.USERS.BY_ID(id));
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
        },
    });
}
