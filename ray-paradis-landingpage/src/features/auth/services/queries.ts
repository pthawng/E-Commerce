import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/services/apiClient';
import { queryKeys } from '@/lib/query-keys';
import { API_ENDPOINTS } from '@shared';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';
import { useStore } from '@/store/useStore';
import type { User } from '@shared';

export function useMe() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const getAccessToken = useAuthStore((state) => state.getAccessToken);
  const setPublicUser = useStore((s) => s.login);

  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const response = await apiGet<User>(API_ENDPOINTS.USERS.ME);
      return response.data;
    },
    enabled: isAuthenticated && !!getAccessToken(),
    staleTime: 1000 * 60 * 5,
    retry: false,
    onSuccess(user) {
      if (user) {
        setPublicUser(user.name || user.email || 'Member', user.email);
      }
    },
  });
}


