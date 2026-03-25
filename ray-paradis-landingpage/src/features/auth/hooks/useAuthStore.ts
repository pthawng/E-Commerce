import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens, User } from '@shared';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  clearAuth: () => void;
  getAccessToken: () => string | null;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      setAuth: (user, tokens) => {
        set({ user, tokens, isAuthenticated: true });
      },
      setUser: (user) => set({ user }),
      setTokens: (tokens) => set({ tokens, isAuthenticated: !!tokens }),
      clearAuth: () => {
        set({ user: null, tokens: null, isAuthenticated: false });
      },
      getAccessToken: () => {
        return get().tokens?.accessToken || null;
      },
      fetchUser: async () => {
        const { tokens } = get();
        if (!tokens?.accessToken) return;

        try {
          const { apiGet } = await import('@/services/apiClient');
          // Use direct string to avoid circular dependency + stale shared types in complex interceptor flow
          const resp = await apiGet<User>('/api/auth/me');
          if (resp.data) {
            set({ user: resp.data });
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // Don't clear auth here unless it's a 401, but interceptor handles that
        }
      },
    }),
    {
      name: 'ray-paradis-auth',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);


