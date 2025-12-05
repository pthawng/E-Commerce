/**
 * Auth Queries
 * TanStack Query hooks cho authentication
 */
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiGet } from '../apiClient';
import { useAuthStore } from '@/store/auth.store';
import type { User } from '@shared/types';
import { API_ENDPOINTS } from '@shared/config';

/**
 * Get current user
 */
export function useMe() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const getAccessToken = useAuthStore((state) => state.getAccessToken);

  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const response = await apiGet<User>(API_ENDPOINTS.USERS.ME);
      return response.data;
    },
    enabled: isAuthenticated && !!getAccessToken(), // Chỉ fetch khi đã authenticated
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Không retry khi fail (tránh loop)
  });
}

/**
 * Get user profile
 */
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: async () => {
      const response = await apiGet<User>(API_ENDPOINTS.USERS.ME);
      return response.data;
    },
  });
}

