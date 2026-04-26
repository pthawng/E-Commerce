import api from './apiInstance';

export interface Notification {
    id: string;
    userId: string | null;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ACTION_REQUIRED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    content: string;
    metadata: any;
    isRead: boolean;
    createdAt: string;
}

export const notificationApi = {
    getAll: async (isRead?: boolean) => {
        const response = await api.get<Notification[]>('/admin/notifications', {
            params: { isRead }
        });
        return response.data;
    },
    markAsRead: async (id: string) => {
        await api.patch(`/admin/notifications/${id}/read`);
    },
    markAllAsRead: async () => {
        await api.patch('/admin/notifications/read-all');
    }
};
