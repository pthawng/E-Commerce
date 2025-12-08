/**
 * Auth Mutations
 * TanStack Query mutation hooks cho authentication
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiPost } from '../apiClient';
import { useAuthStore } from '@/store/auth.store';
import type { LoginPayload, RegisterPayload, AuthResponse } from '@shared';
import { API_ENDPOINTS } from '@shared';

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (data: LoginPayload) => {
      const response = await apiPost<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.user && data?.tokens) {
        // Convert AuthResponse.user to User type
        const user = {
          ...data.user,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setAuth(user, data.tokens);
        // Invalidate auth queries
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      }
    },
  });
}

/**
 * Register mutation
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (data: RegisterPayload) => {
      const response = await apiPost<AuthResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        data,
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.user && data?.tokens) {
        // Convert AuthResponse.user to User type
        const user = {
          ...data.user,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setAuth(user, data.tokens);
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      }
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: async () => {
      // Call logout API if needed
      try {
        await apiPost(API_ENDPOINTS.AUTH.LOGOUT);
      } catch (error) {
        // Even if API fails, clear local auth
        console.error('Logout API error:', error);
      }
    },
    onSuccess: () => {
      clearAuth();
      // Clear all queries
      queryClient.clear();
    },
  });
}

/**
 * Refresh token mutation
 */
export function useRefreshToken() {
  const setTokens = useAuthStore((state) => state.setTokens);
  const tokens = useAuthStore((state) => state.tokens);

  return useMutation({
    mutationFn: async () => {
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiPost<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH, {
        refreshToken: tokens.refreshToken,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.tokens) {
        setTokens(data.tokens);
      }
    },
  });
}

