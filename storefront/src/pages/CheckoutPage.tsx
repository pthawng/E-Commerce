import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckoutShippingSchemaV1, CheckoutShippingV1 } from '@shared';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { CheckoutService } from '@/features/checkout/services/CheckoutService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ChevronLeft, Lock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VietQRPaymentModal } from '@/components/payment/VietQRPaymentModal';
import { Layout } from '@/components/layout/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import { useStore } from '@/store/useStore';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';
import { cn } from '@/lib/utils';

export const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    const { formatPrice } = useStore();
    const { items, totals, fetchCart } = useCartStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'VIETQR' | 'VNPAY' | 'PAYPAL'>('VNPAY');

    const [vietQRInfo, setVietQRInfo] = useState<{
        orderId: string;
        orderCode: string;
        amount: number;
        transferCode: string;
        qrUrl: string;
        accountNo: string;
        accountName: string;
        note: string;
        expiresAt: string;
    } | null>(null);

    const user = useAuthStore(s => s.user);

    // Initialize React Hook Form with Zod validation
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors }
    } = useForm<CheckoutShippingV1>({
        resolver: zodResolver(CheckoutShippingSchemaV1),
        mode: 'onBlur',
        defaultValues: {
            fullName: '',
            phone: '',
            email: '',
            addressLine: '',
            ward: '',
            district: '',
            province: '',
        }
    });

    // Pre-fill user data if logged in
    useEffect(() => {
        if (user) {
            if (user.fullName) setValue('fullName', user.fullName);
            if (user.email) setValue('email', user.email);
            if (user.phone) setValue('phone', user.phone);
        }
    }, [user, setValue]);

    useEffect(() => {
        document.title = t('common.meta.checkout');
    }, [t]);

    useEffect(() => {
        if (items.length === 0) {
            fetchCart().then(() => {
                if (useCartStore.getState().items.length === 0) {
                    navigate('/cart');
                }
            });
        }
    }, [items.length, fetchCart, navigate]);

    const onSubmit = async (formData: CheckoutShippingV1) => {
        setIsSubmitting(true);

        try {
            const validateResponse = await CheckoutService.validateCheckout();
            const { checkoutToken } = validateResponse;

            const payload = {
                checkoutToken,
                shippingAddress: formData,
                paymentMethod,
                guestEmail: formData.email,
                confirmPriceChange: true,
                returnUrl: `${window.location.origin}/payment-result`,
                cancelUrl: `${window.location.origin}/payment-result?status=failed`
            };

            const orderResponse = await CheckoutService.createOrder(payload);

            const paymentUrl = orderResponse.payment?.paymentUrl;
            const paymentMeta = orderResponse.payment?.metadata;

            if (paymentUrl) {
                window.location.href = paymentUrl;
            } else if (paymentMethod === 'VIETQR' && paymentMeta?.transferCode) {
                setVietQRInfo({
                    orderId: orderResponse.orderId || orderResponse.order?.id || '',
                    orderCode: orderResponse.orderCode || orderResponse.order?.orderCode || '',
                    amount: totals.total,
                    transferCode: paymentMeta.transferCode,
                    qrUrl: paymentMeta.qrUrl || '',
                    accountNo: paymentMeta.accountNo || '',
                    accountName: paymentMeta.accountName || '',
                    note: paymentMeta.note || paymentMeta.transferCode,
                    expiresAt: paymentMeta.expiresAt || new Date(Date.now() + 20 * 60 * 1000).toISOString(),
                });
            } else {
                toast.success(t('checkout.messages.success'));
                navigate('/');
            }
        } catch (err: any) {
            if (err.response?.status === 409) {
                toast.error(t('checkout.messages.cartChanged'));
                await fetchCart();
                return;
            }
            toast.error(err.response?.data?.message || t('checkout.messages.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (items.length === 0) return null;

    const ErrorMessage = ({ error }: { error?: { message?: string } }) => {
        if (!error?.message) return null;
        return (
            <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] text-destructive mt-1 flex items-center gap-1 font-body lowercase tracking-wide"
            >
                <AlertCircle className="w-2.5 h-2.5" /> {error.message}
            </motion.p>
        );
    };

    return (
        <>
            <Layout forceHeaderOpaque={true}>
                <div className="bg-background/95 pt-32 sm:pt-40 pb-20">
                    <div className="container max-w-7xl mx-auto px-4 md:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 items-center mb-12 gap-4">
                            <div className="hidden md:block">
                                <Button
                                    variant="ghost"
                                    onClick={() => navigate('/cart')}
                                    className="hover:bg-transparent -ml-4 flex items-center text-muted-foreground hover:text-foreground"
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    {t('common.actions.backToCart')}
                                </Button>
                            </div>

                            <div className="text-center">
                                <h1 className="text-3xl font-serif text-foreground mb-2">{t('checkout.title')}</h1>
                                <p className="text-muted-foreground text-[10px] flex items-center justify-center tracking-widest uppercase">
                                    <Lock className="h-3 w-3 mr-1 text-gold" /> {t('checkout.secure')}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-8 space-y-8">
                                <Card className="border-none shadow-luxury-soft rounded-none bg-card">
                                    <CardHeader className="border-b border-border/10 py-6">
                                        <CardTitle className="text-lg font-medium tracking-tight text-foreground uppercase">{t('checkout.steps.shipping')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 sm:p-8 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="fullName" className="text-[10px] uppercase tracking-widest">{t('checkout.fields.fullName')}</Label>
                                                <Input
                                                    {...register('fullName')}
                                                    id="fullName"
                                                    placeholder={t('auth.placeholders.name')}
                                                    className={cn("rounded-none border-border/50 focus-visible:ring-gold/20", errors.fullName && "border-destructive/50")}
                                                />
                                                <ErrorMessage error={errors.fullName} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone" className="text-[10px] uppercase tracking-widest">{t('checkout.fields.phone')}</Label>
                                                <Input
                                                    {...register('phone')}
                                                    id="phone"
                                                    placeholder="0901234567"
                                                    className={cn("rounded-none border-border/50 focus-visible:ring-gold/20", errors.phone && "border-destructive/50")}
                                                />
                                                <ErrorMessage error={errors.phone} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-[10px] uppercase tracking-widest">{t('checkout.fields.email')}</Label>
                                            <Input
                                                {...register('email')}
                                                id="email"
                                                placeholder={t('auth.placeholders.email')}
                                                className={cn("rounded-none border-border/50 focus-visible:ring-gold/20", errors.email && "border-destructive/50")}
                                            />
                                            <ErrorMessage error={errors.email} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="addressLine" className="text-[10px] uppercase tracking-widest">{t('checkout.fields.address')}</Label>
                                            <Input
                                                {...register('addressLine')}
                                                id="addressLine"
                                                placeholder="123 Lê Lợi"
                                                className={cn("rounded-none border-border/50 focus-visible:ring-gold/20", errors.addressLine && "border-destructive/50")}
                                            />
                                            <ErrorMessage error={errors.addressLine} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="ward" className="text-[10px] uppercase tracking-widest">{t('checkout.fields.ward')}</Label>
                                                <Input
                                                    {...register('ward')}
                                                    id="ward"
                                                    className={cn("rounded-none border-border/50 focus-visible:ring-gold/20", errors.ward && "border-destructive/50")}
                                                />
                                                <ErrorMessage error={errors.ward} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="district" className="text-[10px] uppercase tracking-widest">{t('checkout.fields.district')}</Label>
                                                <Input
                                                    {...register('district')}
                                                    id="district"
                                                    className={cn("rounded-none border-border/50 focus-visible:ring-gold/20", errors.district && "border-destructive/50")}
                                                />
                                                <ErrorMessage error={errors.district} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="province" className="text-[10px] uppercase tracking-widest">{t('checkout.fields.province')}</Label>
                                                <Input
                                                    {...register('province')}
                                                    id="province"
                                                    className={cn("rounded-none border-border/50 focus-visible:ring-gold/20", errors.province && "border-destructive/50")}
                                                />
                                                <ErrorMessage error={errors.province} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-luxury-soft rounded-none bg-card">
                                    <CardHeader className="border-b border-border/10 py-6">
                                        <CardTitle className="text-lg font-medium tracking-tight text-foreground uppercase">{t('checkout.steps.payment')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 sm:p-8">
                                        <RadioGroup
                                            value={paymentMethod}
                                            onValueChange={(val: any) => setPaymentMethod(val)}
                                            className="grid gap-4"
                                        >
                                            {['VNPAY', 'PAYPAL', 'VIETQR'].map((method) => (
                                                <div key={method} className={cn(
                                                    "flex items-center space-x-4 p-4 border transition-all cursor-pointer",
                                                    paymentMethod === method ? "border-gold bg-gold/5" : "border-border/50 hover:border-gold/30"
                                                )}>
                                                    <RadioGroupItem value={method} id={method.toLowerCase()} />
                                                    <Label htmlFor={method.toLowerCase()} className="flex-1 cursor-pointer">
                                                        <span className="font-medium text-foreground uppercase tracking-widest text-[10px]">
                                                            {t(`checkout.payment.${method.toLowerCase()}`)}
                                                        </span>
                                                        <p className="text-[10px] text-muted-foreground mt-1 font-body">
                                                            {t(`checkout.payment.${method.toLowerCase()}Desc`)}
                                                        </p>
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
                                <Card className="border-none shadow-luxury rounded-none bg-card">
                                    <CardHeader className="border-b border-border/10 py-6">
                                        <CardTitle className="text-lg font-medium tracking-tight text-foreground uppercase">{t('checkout.summary.title')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 sm:p-8 space-y-6">
                                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-luxury">
                                            {items.map((item) => (
                                                <div key={item.variantId} className="flex gap-4">
                                                    <div className="h-16 w-16 bg-secondary/10 flex-shrink-0">
                                                        <img
                                                            src={item.image}
                                                            alt={typeof item.name === 'string' ? item.name : (item.name[language] || item.name.en)}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-foreground truncate uppercase tracking-wide">
                                                            {typeof item.name === 'string' ? item.name : (item.name[language] || item.name.en)}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground font-body mt-1">
                                                            {t('cart.quantity')}: {item.quantity} × {formatPrice(item.price)}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs font-medium text-foreground">
                                                        {formatPrice(item.price * item.quantity)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        <Separator className="bg-border/10" />

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground font-body">{t('checkout.summary.subtotal')}</span>
                                                <span className="text-foreground">{formatPrice(totals.subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground font-body">{t('checkout.summary.shipping')}</span>
                                                <span className="text-gold tracking-widest text-[10px] uppercase">
                                                    {totals.shipping === 0 ? t('checkout.summary.complimentary') : formatPrice(totals.shipping)}
                                                </span>
                                            </div>
                                        </div>

                                        <Separator className="bg-border/10" />
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-medium text-foreground uppercase tracking-ultra">{t('checkout.summary.total')}</span>
                                            <span className="text-2xl font-serif text-primary italic">
                                                {formatPrice(totals.total)}
                                            </span>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full bg-primary hover:bg-gold hover:text-primary text-primary-foreground py-6 text-[10px] uppercase tracking-ultra h-14 rounded-none transition-all duration-700"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? t('common.actions.processing') : t('common.actions.placeOrder')}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </form>
                    </div>
                </div>
            </Layout>

            {vietQRInfo && (
                <VietQRPaymentModal
                    info={vietQRInfo}
                    formatPrice={formatPrice}
                    onClose={() => setVietQRInfo(null)}
                />
            )}
        </>
    );
};

export default CheckoutPage;
