import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiPost, apiGet } from '@/services/apiClient';
import { API_ENDPOINTS } from '@shared';
import { toast } from 'sonner';

export type VerifyStatus = 'idle' | 'verifying' | 'success' | 'error';

export function useResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle');
    const [userInfo, setUserInfo] = useState<{ email: string; name?: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Verify token on mount (or when token changes)
    useEffect(() => {
        if (!token) {
            setVerifyStatus('error');
            setError('Đường dẫn không hợp lệ hoặc bị thiếu');
            return;
        }

        const verifyToken = async () => {
            setVerifyStatus('verifying');
            try {
                const res = await apiGet<{ valid: boolean; email: string; name: string }>(
                    `${API_ENDPOINTS.AUTH.RESET_PASSWORD_VERIFY}?token=${token}`
                );

                if (res.data?.valid) {
                    setVerifyStatus('success');
                    setUserInfo({
                        email: res.data.email,
                        name: res.data.name
                    });
                } else {
                    setVerifyStatus('error');
                    setError('Liên kết không hợp lệ');
                }
            } catch (err: any) {
                setVerifyStatus('error');
                setError(err?.message || 'Liên kết không hợp lệ hoặc đã hết hạn');
            }
        };

        verifyToken();
    }, [token]);

    const resetPassword = async (password: string, confirmPassword: string, onSuccess: () => void) => {
        setError('');
        setIsSubmitting(true);

        try {
            await apiPost(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
                token,
                newPassword: password,
                confirmPassword,
            });
            toast.success('Đặt lại mật khẩu thành công, vui lòng đăng nhập lại');
            onSuccess();
        } catch (err: any) {
            const message = err?.message || 'Có lỗi xảy ra, vui lòng thử lại';
            toast.error(message);
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        token,
        verifyStatus,
        userInfo,
        error,
        setError,
        isSubmitting,
        resetPassword
    };
}
