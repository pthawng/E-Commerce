import { api } from './base';

export const uploadFileApi = async (file: File, folder: string = 'avatars'): Promise<{ url: string; path: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    // The 'api' instance should handle the base URL and auth headers
    return api.post<{ url: string; path: string }>('/storage/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }) as unknown as { url: string; path: string };
};
