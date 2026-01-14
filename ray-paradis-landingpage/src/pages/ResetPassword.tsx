import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiPost, apiGet } from '@/services/apiClient';
import { API_ENDPOINTS } from '@shared';
import { toast } from 'sonner';

const passwordSchema = z.string().min(8);

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const [userInfo, setUserInfo] = useState<{ email: string; name?: string } | null>(null);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!passwordSchema.safeParse(password).success) {
            setError('Mật khẩu phải có ít nhất 8 ký tự');
            return;
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setIsLoading(true);

        try {
            await apiPost(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
                token,
                newPassword: password,
                confirmPassword,
            });
            toast.success('Đặt lại mật khẩu thành công, vui lòng đăng nhập lại');
            navigate('/');
        } catch (err: any) {
            const message = err?.message || 'Có lỗi xảy ra, vui lòng thử lại';
            toast.error(message);
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) return null;

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md space-y-8"
            >
                <div className="text-center space-y-2">
                    <h1 className="font-display text-3xl text-foreground">Đặt lại mật khẩu</h1>

                    {verifyStatus === 'verifying' && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Đang xác minh liên kết...</p>
                        </div>
                    )}

                    {verifyStatus === 'error' && (
                        <div className="py-6 space-y-4">
                            <p className="text-destructive font-medium">{error}</p>
                            <Button variant="outline" onClick={() => navigate('/forgot-password')}>
                                Yêu cầu liên kết mới
                            </Button>
                        </div>
                    )}

                    {verifyStatus === 'success' && (
                        <>
                            <p className="text-muted-foreground font-body text-sm">
                                Nhập mật khẩu mới cho tài khoản:
                            </p>
                            <div className="font-medium text-foreground bg-secondary/30 py-2 px-4 rounded-md inline-block">
                                {userInfo?.email}
                            </div>
                        </>
                    )}
                </div>

                {verifyStatus === 'success' && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu mới</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pr-10"
                                    placeholder="Nhập mật khẩu mới"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                            <Input
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Nhập lại mật khẩu mới"
                            />
                        </div>

                        {error && (verifyStatus === 'success') && (
                            <p className="text-sm text-destructive text-center">{error}</p>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                'Đặt lại mật khẩu'
                            )}
                        </Button>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
