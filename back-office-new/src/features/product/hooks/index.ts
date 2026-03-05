import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../api';

const keys = {
    all: ['products'] as const,
    list: (params?: object) => [...keys.all, 'list', params] as const,
    one: (id: string) => [...keys.all, 'one', id] as const,
    variants: (productId: string) => [...keys.all, 'variants', productId] as const,
};

export const useProducts = (params?: { page?: number; limit?: number; search?: string }) =>
    useQuery({ queryKey: keys.list(params), queryFn: () => productApi.getAll(params) });

export const useProduct = (id: string) =>
    useQuery({ queryKey: keys.one(id), queryFn: () => productApi.getOne(id), enabled: !!id });

export const useProductVariants = (productId: string) =>
    useQuery({ queryKey: keys.variants(productId), queryFn: () => productApi.getVariants(productId), enabled: !!productId });

export const useCreateProduct = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ data, images }: { data: Parameters<typeof productApi.create>[0]; images?: File[] }) =>
            productApi.create(data, images),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
};

export const useUpdateProduct = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: productApi.update,
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: keys.all });
            qc.invalidateQueries({ queryKey: keys.one(vars.id) });
        },
    });
};

export const useCreateVariant = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: productApi.createVariant,
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: keys.variants(vars.productId) });
            qc.invalidateQueries({ queryKey: keys.all });
        },
    });
};

export const useUpdateVariant = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: productApi.updateVariant,
        onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: keys.variants(vars.productId) }),
    });
};

export const useDeleteVariant = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: productApi.deleteVariant,
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: keys.variants(vars.productId) });
            qc.invalidateQueries({ queryKey: keys.all });
        },
    });
};
