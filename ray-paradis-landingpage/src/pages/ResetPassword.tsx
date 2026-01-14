import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResetPassword } from '@/features/auth/hooks/useResetPassword';

const passwordSchema = z.string().min(8);

export default function ResetPassword() {
    const navigate = useNavigate();
    const {
        token,
        verifyStatus,
        userInfo,
        error,
        setError,
        isSubmitting,
        resetPassword
    } = useResetPassword();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!passwordSchema.safeParse(password).success) {
            setError('Mật khẩu phải có ít nhất 8 ký tự');
            return;
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        await resetPassword(password, confirmPassword, () => {
            navigate('/');
        });
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
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
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
