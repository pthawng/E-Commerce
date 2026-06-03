import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/services/apiClient';
import { queryKeys } from '@/lib/query-keys';
import { API_ENDPOINTS } from '@shared';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';
import type { User } from '@shared';

export function useMe() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuth = useAuthStore((state) => state.setAuth);

  const query = useQuery<User, Error>({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const response = await apiGet<User>(API_ENDPOINTS.AUTH.ME);
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      setAuth(query.data);
    }
  }, [query.data, setAuth]);

  return query;
}


