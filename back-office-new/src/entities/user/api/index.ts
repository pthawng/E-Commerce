import axiosClient from '@/shared/api/axiosClient';
import type { BackendLoginResponse, AuthPayload, User } from '../model/types';
import type { ApiResponse as BaseResponse } from '@ecommerce/shared';
import { jwtDecode } from 'jwt-decode';

export const loginApi = async (data: any): Promise<AuthPayload> => {
    // 1. Login to get tokens and basic user info
    const response = await axiosClient.post<any, BaseResponse<BackendLoginResponse>>('/admin/auth/login', data);

    if (!response.data) throw new Error('Login failed: No data returned');
    const { user, tokens } = response.data;

    // 2. Fetch Permissions using the new access token
    // We need to set the header manually because the interceptor might not have the new token yet if it relies on localStorage
    const permissionsResponse = await axiosClient.get<any, BaseResponse<string[]>>('/auth/permissions', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` }
    });

    // 3. Decode token to get roles (or use what's in the token if backend puts it there)
    const decoded: any = jwtDecode(tokens.accessToken);
    const role = decoded.roles && decoded.roles.length > 0 ? decoded.roles[0] : 'staff'; // Default fallback

    return {
        user: { ...user, role, avatarUrl: '' }, // Map backend user to frontend User type
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        permissions: permissionsResponse.data || [],
    };
};

export const getProfileApi = async (): Promise<User> => {
    // This is called when app reloads/inits
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No token found');

    const decoded: any = jwtDecode(token);
    const userId = decoded.sub;

    // We only need the user profile here, permissions are handled separately or in state
    const userRes = await axiosClient.get<any, BaseResponse<any>>(`/users/${userId}`); // Assuming this returns UserResponseDto which matches User roughly. Typed as any to avoid strict match issues for now

    // We might need to map UserResponseDto to User if they differ significantly
    if (!userRes.data) throw new Error('Failed to fetch user profile');
    const user = userRes.data;
    // Extract role from token as backend User object doesn't have it
    const role = decoded.roles && decoded.roles.length > 0 ? decoded.roles[0] : 'staff';

    return { ...user, role, avatarUrl: '' };
};

export const getPermissionsApi = async (): Promise<string[]> => {
    const response = await axiosClient.get<any, BaseResponse<string[]>>('/auth/permissions');
    return response.data || [];
};

export const refreshTokenApi = async (refreshToken: string): Promise<{ accessToken: string, refreshToken: string }> => {
    const response = await axiosClient.post<any, BaseResponse<{ accessToken: string, refreshToken: string }>>('/auth/refresh', { refreshToken });
    if (!response.data) throw new Error('Failed to refresh token');
    return response.data;
};

import type { PaginatedResponse } from '@ecommerce/shared';
import type { CreateUserDto, UpdateUserDto, UserQueryDto } from '../model/types';

export const getUsersApi = async (query: UserQueryDto): Promise<PaginatedResponse<User>> => {
    const response = await axiosClient.get<any, any>('/users', { params: query });
    return {
        items: response.data || [],
        meta: response.meta || { page: 1, limit: query.limit || 10, total: 0, totalPages: 0 }
    };
}

export const createUserApi = async (data: CreateUserDto): Promise<User> => {
    const response = await axiosClient.post<any, BaseResponse<User>>('/users', data);
    return response.data!;
}

export const updateUserApi = async (id: string, data: UpdateUserDto): Promise<User> => {
    // Assuming backend uses PATCH for update
    const response = await axiosClient.patch<any, BaseResponse<User>>(`/users/${id}`, data);
    return response.data!;
}

export const deleteUserApi = async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<any, BaseResponse<any>>(`/users/${id}`);
    return response.success;
}
