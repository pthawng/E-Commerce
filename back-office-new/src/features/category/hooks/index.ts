import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../api';

const keys = {
    all: ['categories'] as const,
    tree: () => [...keys.all, 'tree'] as const,
    one: (id: string) => [...keys.all, 'one', id] as const,
};

export const useCategoryTree = () =>
    useQuery({ queryKey: keys.tree(), queryFn: categoryApi.getTree, staleTime: 1000 * 60 * 5 });

export const useCreateCategory = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: categoryApi.create,
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
};

export const useUpdateCategory = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: categoryApi.update,
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
};

export const useDeleteCategory = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: categoryApi.remove,
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
};
