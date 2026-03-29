import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/services/apiClient';
import { API_ENDPOINTS } from '@shared';
import { Category } from '../types';

export const categoryKeys = {
    all: ['categories'] as const,
};

export function useCategories() {
    return useQuery({
        queryKey: categoryKeys.all,
        queryFn: async () => {
            const res = await apiGet<Category[]>(API_ENDPOINTS.CATEGORIES.BASE);
            return res.data;
        },
        staleTime: 1000 * 60 * 60, // 1 hour (categories change rarely)
    });
}
