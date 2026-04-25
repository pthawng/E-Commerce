import apiInstance from './apiInstance';

export interface UpdateProfileRequest {
    fullName?: string;
    nickName?: string;
    phone?: string;
    email?: string;
    bio?: string;
    avatarUrl?: string;
}

export const profileApi = {
    getMe: async () => {
        const response = await apiInstance.get('/profile/me');
        return response.data;
    },

    updateProfile: async (data: UpdateProfileRequest) => {
        const response = await apiInstance.patch('/profile/update', data);
        return response.data;
    }
};
