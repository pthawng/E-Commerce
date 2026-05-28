import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens, User } from '@shared';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User) => void;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) => {
        set({ user, isAuthenticated: true });
      },
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearAuth: async () => {
        try {
          const { apiPost } = await import('@/services/apiClient');
          await apiPost('/api/auth/logout', {});
        } catch (error) {
          console.error('Failed to call logout API:', error);
        }
        set({ user: null, isAuthenticated: false });
        // Clear cart on logout
        const { useCartStore } = await import('@/features/cart/store/useCartStore');
        useCartStore.getState().clearCart();
      },
      fetchUser: async () => {
        try {
          const { apiGet } = await import('@/services/apiClient');
          // No tokens needed in header, axiosClient handles cookies
          const resp = await apiGet<User>('/api/auth/me');
          if (resp.data) {
            set({ user: resp.data, isAuthenticated: true });
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          set({ isAuthenticated: false });
        }
      },
    }),
    {
      name: 'ray-paradis-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);


