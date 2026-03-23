import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attributeApi } from '../api';

const keys = {
    all: ['attributes'] as const,
    list: () => [...keys.all, 'list'] as const,
    one: (id: string) => [...keys.all, 'one', id] as const,
};

export const useAttributes = () =>
    useQuery({ queryKey: keys.list(), queryFn: attributeApi.getAll, staleTime: 1000 * 60 * 5 });

export const useCreateAttribute = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: attributeApi.create,
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
};

export const useUpdateAttribute = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: attributeApi.update,
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
};

export const useDeleteAttribute = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: attributeApi.remove,
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
};

export const useCreateAttributeValue = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: attributeApi.createValue,
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
};

export const useUpdateAttributeValue = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: attributeApi.updateValue,
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
};

export const useDeleteAttributeValue = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: attributeApi.removeValue,
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
};
