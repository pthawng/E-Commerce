import { api } from '@/shared/api/base';
import type { BackendLoginResponse, AuthPayload, User, LoginDto, CreateUserDto, UpdateUserDto, UserQueryDto } from '../model/types';
import { jwtDecode } from 'jwt-decode';
import type { PaginatedResponse } from '@ecommerce/shared';

interface CustomJwtPayload {
    sub: string;
    roles?: string[];
    email?: string;
}

export const loginApi = async (data: LoginDto): Promise<AuthPayload> => {
    // 1. Login to get tokens and basic user info
    // THE 'api' INSTANCE IS CONFIGURED TO UNWRAP response.data.data
    // BUT AXIOS TYPES STILL THINK IT'S AN AxiosResponse. WE MUST CAST SAFELY.
    const { user, tokens } = await api.post<BackendLoginResponse>('/admin/auth/login', data) as unknown as BackendLoginResponse;

    // 2. Fetch Permissions using the new access token
    const permissions = await api.get<string[]>('/auth/permissions', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` }
    }) as unknown as string[];

    // 3. Decode token to get roles
    const decoded = jwtDecode<CustomJwtPayload>(tokens.accessToken);
    const role = (decoded.roles && decoded.roles.length > 0) ? decoded.roles[0] : 'staff';

    return {
        user: { ...user, role: role as User['role'], avatarUrl: '' },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        permissions: permissions || [],
    };
};

export const getProfileApi = async (): Promise<User> => {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No token found');

    const decoded = jwtDecode<CustomJwtPayload>(token);
    const userId = decoded.sub;

    const user = await api.get<User>(`/users/${userId}`) as unknown as User;
    const role = (decoded.roles && decoded.roles.length > 0) ? decoded.roles[0] : 'staff';

    return { ...user, role: role as User['role'], avatarUrl: '' };
};

export const getPermissionsApi = async (): Promise<string[]> => {
    return api.get<string[]>('/auth/permissions') as unknown as string[];
};

export const refreshTokenApi = async (refreshToken: string): Promise<{ accessToken: string, refreshToken: string }> => {
    return api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }) as unknown as { accessToken: string; refreshToken: string };
};

export const getUsersApi = async (query: UserQueryDto): Promise<PaginatedResponse<User>> => {
    return api.get<PaginatedResponse<User>>('/users', { params: query }) as unknown as PaginatedResponse<User>;
};

export const createUserApi = async (data: CreateUserDto): Promise<User> => {
    return api.post<User>('/users', data) as unknown as User;
};

export const updateUserApi = async (id: string, data: UpdateUserDto): Promise<User> => {
    return api.patch<User>(`/users/${id}`, data) as unknown as User;
};

export const deleteUserApi = async (id: string): Promise<boolean> => {
    await api.delete(`/users/${id}`);
    return true;
};
