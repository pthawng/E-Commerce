import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVerifyEmail } from '@/features/auth/hooks/useVerifyEmail';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { verify, status, error } = useVerifyEmail();

    useEffect(() => {
        if (token && status === 'idle') {
            // We use .then() to handle the result locally for navigation
            verify(token)
                .then((data) => {
                    // Delay slightly for premium UX reading the success message
                    if (!data.requireLogin) {
                        setTimeout(() => navigate('/account'), 2000);
                    }
                })
                .catch(() => {});
        }
    }, [token, status, navigate, verify]);

    if (!token) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
                <XCircle className="w-16 h-16 text-destructive mb-4" />
                <h1 className="font-display text-2xl mb-2">Liên kết không hợp lệ</h1>
                <p className="text-muted-foreground text-center mb-8">
                    Không tìm thấy mã xác thực.
                </p>
                <Button onClick={() => navigate('/')}>Về trang chủ</Button>
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] w-full flex items-center justify-center bg-background px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md text-center space-y-6"
            >
                {status === 'loading' && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <h1 className="font-display text-2xl">Đang xác thực...</h1>
                        <p className="text-muted-foreground">Vui lòng đợi trong giây lát.</p>
                    </div>
                )}

                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-8 space-y-6"
                    >
                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                        <div>
                            <h1 className="font-display text-3xl mb-2">Xác thực thành công</h1>
                            <p className="text-muted-foreground">
                                Cảm ơn bạn. Email của bạn đã được xác thực an toàn.
                            </p>
                        </div>
                        <Button
                            className="w-full"
                            onClick={() => navigate('/account')}
                        >
                            Tiếp tục đến Tài khoản
                        </Button>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-8 space-y-6"
                    >
                        <XCircle className="h-16 w-16 text-destructive mx-auto" />
                        <div>
                            <h1 className="font-display text-2xl mb-2">Không thể xác thực</h1>
                            <p className="text-destructive font-medium">{error}</p>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => navigate('/login')}
                        >
                            Đăng nhập thủ công
                        </Button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
