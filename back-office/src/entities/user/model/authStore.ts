import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, AuthPayload } from './types';

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            permissions: [],
            isAuthenticated: false,

            login: (payload: AuthPayload) => {
                set({
                    user: payload.user,
                    accessToken: payload.accessToken,
                    refreshToken: payload.refreshToken,
                    permissions: payload.permissions,
                    isAuthenticated: true,
                });

                // Also set token for axios immediately if possible, 
                // but usually axios interceptor reads from localStorage/store
                localStorage.setItem('access_token', payload.accessToken);
                localStorage.setItem('refresh_token', payload.refreshToken);
            },

            logout: () => {
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    permissions: [],
                    isAuthenticated: false,
                });
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            },

            updateUser: (updates) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                })),
        }),
        {
            name: 'auth-storage', // name of the item in the storage (must be unique)
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                permissions: state.permissions,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);
