import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiGet } from '@/services/apiClient';
import { useAuthStore } from '../hooks/useAuthStore';
import type { User } from '@shared';
import { API_ENDPOINTS } from '@shared';

export function useMe() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const getAccessToken = useAuthStore((state) => state.getAccessToken);

    return useQuery({
        queryKey: queryKeys.auth.me(),
        queryFn: async () => {
            const response = await apiGet<User>(API_ENDPOINTS.USERS.ME);
            return response.data;
        },
        enabled: isAuthenticated && !!getAccessToken(),
        staleTime: 1000 * 60 * 5,
        retry: false,
    });
}

export function useProfile() {
    return useQuery({
        queryKey: queryKeys.auth.profile(),
        queryFn: async () => {
            const response = await apiGet<User>(API_ENDPOINTS.USERS.ME);
            return response.data;
        },
    });
}
