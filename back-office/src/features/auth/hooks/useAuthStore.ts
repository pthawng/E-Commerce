import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens } from '@shared';
import { SESSION } from '@shared';

interface AuthState {
    user: User | null;
    tokens: AuthTokens | null;
    permissions: string[];
    isAuthenticated: boolean;
    setAuth: (user: User, tokens: AuthTokens, permissions?: string[]) => void;
    setUser: (user: User) => void;
    setPermissions: (permissions: string[]) => void;
    setTokens: (tokens: AuthTokens) => void;
    clearAuth: () => void;
    getAccessToken: () => string | null;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            tokens: null,
            permissions: [],
            isAuthenticated: false,

            setAuth: (user, tokens, permissions = []) => {
                set({
                    user,
                    tokens,
                    permissions,
                    isAuthenticated: true,
                });
            },

            setUser: (user) => {
                set({ user });
            },

            setPermissions: (permissions) => {
                set({ permissions });
            },

            setTokens: (tokens) => {
                set({ tokens, isAuthenticated: !!tokens });
            },

            clearAuth: () => {
                set({
                    user: null,
                    tokens: null,
                    permissions: [],
                    isAuthenticated: false,
                });
            },

            getAccessToken: () => {
                return get().tokens?.accessToken || null;
            },
        }),
        {
            name: SESSION.USER_KEY,
            partialize: (state) => ({
                user: state.user,
                tokens: state.tokens,
                permissions: state.permissions,
                isAuthenticated: state.isAuthenticated,
            }),
        },
    ),
);
