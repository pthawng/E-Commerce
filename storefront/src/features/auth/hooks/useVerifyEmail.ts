import { useState } from 'react';
import { apiPost } from '@/services/apiClient';
import { useAuthStore } from './useAuthStore';
import { API_ENDPOINTS, type User } from '@shared';

export function useVerifyEmail() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string>('');
    const { setAuth } = useAuthStore();

    const verify = async (token: string) => {
        setStatus('loading');
        try {
            const { data } = await apiPost<{ verified: boolean, requireLogin: boolean, auth?: { user: unknown } }>(
                API_ENDPOINTS.AUTH.VERIFY_EMAIL,
                { token }
            );

            // If the backend securely set cookies from `auth` payload, we just tell the store we're authenticated
            if (!data.requireLogin && data.auth && data.auth.user) {
                // Update the UI state since the backend successfully set HttpOnly Cookies
                useAuthStore.getState().setAuth(data.auth.user as User);
            }

            setStatus('success');
            return data;
        } catch (err) {
            setStatus('error');
            const errorObj = err as { response?: { data?: { message?: string } } };
            setError(errorObj.response?.data?.message || 'Có lỗi xảy ra trong quá trình xác thực.');
            throw err;
        }
    };

    return { verify, status, error };
}
