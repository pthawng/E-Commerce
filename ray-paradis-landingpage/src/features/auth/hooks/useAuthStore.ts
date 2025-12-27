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


