import axiosClient from '@/shared/api/axiosClient';
import type { BackendLoginResponse, AuthPayload, User } from '../model/types';
import { jwtDecode } from 'jwt-decode';

export const loginApi = async (data: any): Promise<AuthPayload> => {
    // 1. Login to get tokens and basic user info
    const response = await axiosClient.post<BackendLoginResponse>('/admin/auth/login', data);
    const { user, tokens } = response.data;

    // 2. Fetch Permissions using the new access token
    // We need to set the header manually because the interceptor might not have the new token yet if it relies on localStorage
    const permissionsResponse = await axiosClient.get<string[]>('/auth/permissions', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` }
    });

    // 3. Decode token to get roles (or use what's in the token if backend puts it there)
    const decoded: any = jwtDecode(tokens.accessToken);
    const role = decoded.roles && decoded.roles.length > 0 ? decoded.roles[0] : 'staff'; // Default fallback

    return {
        user: { ...user, role, avatarUrl: '' }, // Map backend user to frontend User type
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        permissions: permissionsResponse.data,
    };
};

export const getProfileApi = async (): Promise<User> => {
    // This is called when app reloads/inits
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No token found');

    const decoded: any = jwtDecode(token);
    const userId = decoded.sub;

    // Parallel fetch for speed
    const [userRes, permRes] = await Promise.all([
        axiosClient.get<any>(`/users/${userId}`), // Assuming this returns UserResponseDto which matches User roughly. Typed as any to avoid strict match issues for now
        axiosClient.get<string[]>('/auth/permissions')
    ]);

    // We might need to map UserResponseDto to User if they differ significantly
    const user = userRes.data;
    const permissions = permRes.data;

    // Extract role from token as backend User object doesn't have it
    const role = decoded.roles && decoded.roles.length > 0 ? decoded.roles[0] : 'staff';

    return { ...user, role, avatarUrl: '' };
};

export const getPermissionsApi = async (): Promise<string[]> => {
    const response = await axiosClient.get<string[]>('/auth/permissions');
    return response.data;
};

export const refreshTokenApi = async (refreshToken: string): Promise<{ accessToken: string, refreshToken: string }> => {
    const response = await axiosClient.post('/auth/refresh', { refreshToken });
    return response.data;
};
