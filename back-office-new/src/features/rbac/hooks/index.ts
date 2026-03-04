import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacApi } from '../api';

export const rbacKeys = {
    allRoles: ['roles'] as const,
    rolesList: (filters?: Record<string, any>) => ['roles', 'list', filters] as const,
    roleDetails: (id: string) => ['roles', 'detail', id] as const,
    allPermissions: ['permissions'] as const,
};

export const useRoles = () => {
    return useQuery({
        queryKey: rbacKeys.rolesList(),
        queryFn: () => rbacApi.getRoles(),
    });
};

export const useRole = (id?: string) => {
    return useQuery({
        queryKey: rbacKeys.roleDetails(id!),
        queryFn: () => rbacApi.getRole(id!),
        enabled: !!id,
    });
};

export const useCreateRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: rbacApi.createRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: rbacKeys.allRoles });
        },
    });
};

export const useUpdateRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: rbacApi.updateRole,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: rbacKeys.allRoles });
            queryClient.invalidateQueries({ queryKey: rbacKeys.roleDetails(variables.id) });
        },
    });
};

export const useDeleteRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: rbacApi.deleteRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: rbacKeys.allRoles });
        },
    });
};

export const usePermissions = () => {
    return useQuery({
        queryKey: rbacKeys.allPermissions,
        queryFn: rbacApi.getPermissions,
        // Permissions change rarely, cache for a long time
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};

export const useCreatePermission = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: rbacApi.createPermission,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: rbacKeys.allPermissions });
        },
    });
};

export const useUpdatePermission = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: rbacApi.updatePermission,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: rbacKeys.allPermissions });
        },
    });
};

export const useDeletePermission = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: rbacApi.deletePermission,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: rbacKeys.allPermissions });
        },
    });
};
