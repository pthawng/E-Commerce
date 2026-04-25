import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: string;
    email: string;
    fullName: string;
    nickName?: string;
    avatarUrl?: string;
    bio?: string;
    roles: string[];
    permissions: string[];
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isStepUpVerified: boolean; // For critical actions
    lastActivity: number;

    // Actions
    setAuth: (user: User, accessToken: string, refreshToken: string) => void;
    clearAuth: () => void;
    setStepUpVerified: (verified: boolean) => void;
    updateActivity: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isStepUpVerified: false,
            lastActivity: Date.now(),

            setAuth: (user, accessToken, refreshToken) => set({
                user,
                accessToken,
                refreshToken,
                isAuthenticated: true,
                lastActivity: Date.now()
            }),

            clearAuth: () => set({
                user: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
                isStepUpVerified: false
            }),

            setStepUpVerified: (verified) => set({ isStepUpVerified: verified }),

            updateActivity: () => set({ lastActivity: Date.now() }),
        }),
        {
            name: 'ray-paradis-auth',
        }
    )
);
