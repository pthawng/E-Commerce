import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';
import { CheckoutService } from '@/features/checkout/services/CheckoutService';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface GuestOTPModalProps {
    isOpen: boolean;
    onClose: () => void;
    email: string;
    onVerified: (token: string) => void;
}

export const GuestOTPModal: React.FC<GuestOTPModalProps> = ({
    isOpen,
    onClose,
    email,
    onVerified
}) => {
    const { t } = useTranslation();
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Handle resend countdown
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleVerify = async () => {
        if (otp.length !== 6) return;

        setIsVerifying(true);
        try {
            const result = await CheckoutService.verifyGuestOTP(email, otp);
            onVerified(result.guestVerifyToken);
            toast.success(t('auth.guest.verifySuccess'));
        } catch (err: any) {
            console.error('OTP Verification error:', err);
            toast.error(err.response?.data?.message || t('auth.guest.verifyError'));
            setOtp('');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;

        setIsResending(true);
        try {
            await CheckoutService.requestGuestOTP(email);
            setCountdown(60);
            toast.success(t('auth.guest.resendSuccess'));
        } catch (err) {
            toast.error(t('auth.guest.resendError'));
        } finally {
            setIsResending(false);
        }
    };

    // Auto-verify when 6 digits are reached
    useEffect(() => {
        if (otp.length === 6) {
            handleVerify();
        }
    }, [otp]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md border-none shadow-luxury-soft rounded-none p-8">
                <DialogHeader className="space-y-4">
                    <div className="mx-auto bg-primary/5 p-4 rounded-full w-fit">
                        <Mail className="h-8 w-8 text-primary" strokeWidth={1.5} />
                    </div>
                    <DialogTitle className="text-2xl font-serif italic text-center tracking-tight">
                        {t('auth.guest.verifyTitle')}
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground font-light text-sm px-4">
                        {t('auth.guest.verifySubtitle')}
                        <br />
                        <span className="font-semibold text-foreground mt-1 inline-block">{email}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center py-6 space-y-8">
                    <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                        disabled={isVerifying}
                        autoFocus
                    >
                        <InputOTPGroup className="gap-3">
                            <InputOTPSlot index={0} className="w-12 h-14 text-xl font-medium border-border/60" />
                            <InputOTPSlot index={1} className="w-12 h-14 text-xl font-medium border-border/60" />
                            <InputOTPSlot index={2} className="w-12 h-14 text-xl font-medium border-border/60" />
                            <InputOTPSlot index={3} className="w-12 h-14 text-xl font-medium border-border/60" />
                            <InputOTPSlot index={4} className="w-12 h-14 text-xl font-medium border-border/60" />
                            <InputOTPSlot index={5} className="w-12 h-14 text-xl font-medium border-border/60" />
                        </InputOTPGroup>
                    </InputOTP>

                    <div className="text-center space-y-2">
                        <p className="text-xs text-muted-foreground italic flex items-center justify-center gap-2">
                            <ShieldCheck className="h-3 w-3 text-gold" />
                            {t('auth.guest.secureNote')}
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex flex-col gap-3 sm:flex-col sm:justify-center sm:space-x-0">
                    <Button
                        onClick={handleVerify}
                        disabled={otp.length !== 6 || isVerifying}
                        className="w-full h-12 rounded-none tracking-ultra uppercase text-[10px] bg-primary hover:bg-gold transition-all duration-500"
                    >
                        {isVerifying ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            t('common.actions.verify')
                        )}
                    </Button>

                    <button
                        onClick={handleResend}
                        disabled={countdown > 0 || isResending}
                        className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isResending ? (
                            t('common.actions.sending')
                        ) : countdown > 0 ? (
                            `${t('auth.guest.resendIn')} ${countdown}s`
                        ) : (
                            t('auth.guest.resendAction')
                        )}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
