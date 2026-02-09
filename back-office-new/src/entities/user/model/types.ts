export interface User {
    id: string;
    email: string;
    fullName: string;
    role: 'admin' | 'staff' | 'manager';
    avatarUrl?: string;
}

export interface BackendLoginResponse {
    user: {
        id: string;
        email: string;
        fullName: string;
        isActive: boolean;
        isEmailVerified: boolean;
        phone?: string;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}

export interface AuthPayload {
    user: User;
    accessToken: string;
    refreshToken: string;
    permissions: string[];
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    permissions: string[];
    isAuthenticated: boolean;

    // Actions
    login: (payload: AuthPayload) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
}
