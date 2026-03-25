import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { CheckoutService } from '@/features/checkout/services/CheckoutService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ChevronLeft, Lock } from 'lucide-react';
import { CartService } from '@/features/cart/services/CartService';
import { Layout } from '@/components/layout/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import { useStore } from '@/store/useStore';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';

/**
 * CheckoutPage
 * Premium One-Page Checkout Experience
 * Implements: 3-step Lifecycle & Idempotency
 */
export const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    const { formatPrice } = useStore();
    const { items, totals, fetchCart } = useCartStore();
    const [idempotencyKey] = useState(() => crypto.randomUUID());
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        addressLine: '',
        ward: '',
        district: '',
        province: '',
    });

    const [paymentMethod, setPaymentMethod] = useState<'VIETQR' | 'VNPAY' | 'PAYPAL'>('VNPAY');

    const user = useAuthStore(s => s.user);

    // Pre-fill user data if logged in
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.fullName || prev.fullName,
                email: user.email || prev.email,
                phone: user.phone || prev.phone || '',
            }));
        }
    }, [user]);

    // Ensure cart is loaded
    useEffect(() => {
        if (items.length === 0) {
            fetchCart().then(() => {
                if (useCartStore.getState().items.length === 0) {
                    navigate('/cart');
                }
            });
        }
    }, [items.length, fetchCart, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePlaceOrder = async () => {
        // Simple validation
        if (!formData.fullName || !formData.phone || !formData.addressLine) {
            toast.error(t.checkout.validation.required);
            return;
        }

        setIsSubmitting(true);
        const cartSessionId = CartService.getSessionId();

        try {
            // STEP 1: VALIDATE CHECKOUT (Secure Snapshot & Token)
            const validateResponse = await CheckoutService.validateCheckout(cartSessionId);
            const { checkoutToken } = validateResponse;

            // STEP 2: CREATE ORDER
            const payload = {
                checkoutToken, // Secure token from Step 1
                shippingAddress: {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    addressLine: formData.addressLine,
                    ward: formData.ward,
                    district: formData.district,
                    province: formData.province,
                },
                paymentMethod,
                guestEmail: formData.email,
                confirmPriceChange: true, 
                idempotencyKey 
            };

            const orderResponse = await CheckoutService.createOrder(payload, idempotencyKey, cartSessionId);
            
            if (orderResponse.paymentUrl) {
                // STEP 3: REDIRECT TO PAYMENT GATEWAY
                window.location.href = orderResponse.paymentUrl;
            } else {
                toast.success(t.checkout.validation.success);
                navigate('/');
            }
        } catch (err: any) {
            console.error("Checkout Failed:", err);
            
            if (err.response?.status === 409) {
                toast.error(t.checkout.validation.cartChanged);
                await fetchCart();
                return;
            }

            toast.error(err.response?.data?.message || t.checkout.validation.error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (items.length === 0) return null;

    return (
        <Layout forceHeaderOpaque={true}>
            <div className="bg-background/95 pt-32 sm:pt-40 pb-20">
            <div className="container max-w-7xl mx-auto px-4 md:px-8">
                {/* Header Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center mb-12 gap-4">
                    <div className="hidden md:block">
                        <Button 
                            variant="ghost" 
                            onClick={() => navigate('/cart')}
                            className="hover:bg-transparent -ml-4 flex items-center text-muted-foreground hover:text-foreground"
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            {t.checkout.backToCart}
                        </Button>
                    </div>
                    
                    <div className="text-center">
                        <h1 className="text-3xl font-serif text-foreground mb-2">{t.checkout.title}</h1>
                        <p className="text-muted-foreground text-xs flex items-center justify-center tracking-wide uppercase">
                            <Lock className="h-3 w-3 mr-1" /> {t.checkout.secure}
                        </p>
                    </div>

                    <div className="hidden md:block" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Primary Flow (Left) */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* 1. SHIPPING INFORMATION */}
                        <Card className="border-none shadow-sm rounded-none overflow-hidden bg-card">
                            <CardHeader className="border-b border-border py-6">
                                <CardTitle className="text-xl font-medium tracking-tight text-foreground">{t.checkout.shippingInfo}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">{t.checkout.fullName}</Label>
                                        <Input 
                                            id="fullName" 
                                            name="fullName" 
                                            placeholder="Nguyễn Văn A" 
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            className="rounded-none border-border focus-visible:ring-gold/50 bg-background"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">{t.checkout.phone}</Label>
                                        <Input 
                                            id="phone" 
                                            name="phone" 
                                            placeholder="0901234567" 
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="rounded-none border-border focus-visible:ring-gold/50 bg-background"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t.checkout.email}</Label>
                                    <Input 
                                        id="email" 
                                        name="email" 
                                        placeholder="a@gmail.com" 
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="rounded-none border-neutral-200 focus:ring-neutral-900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="addressLine">{t.checkout.address}</Label>
                                    <Input 
                                        id="addressLine" 
                                        name="addressLine" 
                                        placeholder="123 Lê Lợi" 
                                        value={formData.addressLine}
                                        onChange={handleInputChange}
                                        className="rounded-none border-neutral-200 focus:ring-neutral-900"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="ward">{t.checkout.ward}</Label>
                                        <Input 
                                            id="ward" 
                                            name="ward" 
                                            value={formData.ward}
                                            onChange={handleInputChange}
                                            className="rounded-none border-border focus-visible:ring-gold/50 bg-background"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="district">{t.checkout.district}</Label>
                                        <Input 
                                            id="district" 
                                            name="district" 
                                            value={formData.district}
                                            onChange={handleInputChange}
                                            className="rounded-none border-border focus-visible:ring-gold/50 bg-background"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="province">{t.checkout.province}</Label>
                                        <Input 
                                            id="province" 
                                            name="province" 
                                            value={formData.province}
                                            onChange={handleInputChange}
                                            className="rounded-none border-border focus-visible:ring-gold/50 bg-background"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. PAYMENT METHOD */}
                        <Card className="border-none shadow-sm rounded-none overflow-hidden bg-card">
                            <CardHeader className="border-b border-border py-6">
                                <CardTitle className="text-xl font-medium tracking-tight text-foreground">{t.checkout.paymentMethod}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                <RadioGroup 
                                    value={paymentMethod} 
                                    onValueChange={(val: any) => setPaymentMethod(val)}
                                    className="grid gap-4"
                                >
                                    <div className="flex items-center space-x-4 p-4 border border-border hover:border-gold transition-colors cursor-pointer group">
                                        <RadioGroupItem value="VNPAY" id="vnpay" />
                                        <Label htmlFor="vnpay" className="flex-1 cursor-pointer font-medium text-foreground">
                                            {t.checkout.payment.vnpay}
                                            <p className="text-xs text-muted-foreground mt-1 font-normal">{t.checkout.payment.vnpayDesc}</p>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-4 p-4 border border-border hover:border-gold transition-colors cursor-pointer group">
                                        <RadioGroupItem value="PAYPAL" id="paypal" />
                                        <Label htmlFor="paypal" className="flex-1 cursor-pointer font-medium text-foreground">
                                            {t.checkout.payment.paypal}
                                            <p className="text-xs text-muted-foreground mt-1 font-normal">{t.checkout.payment.paypalDesc}</p>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-4 p-4 border border-border hover:border-gold transition-colors cursor-pointer group">
                                        <RadioGroupItem value="VIETQR" id="vietqr" />
                                        <Label htmlFor="vietqr" className="flex-1 cursor-pointer font-medium text-foreground">
                                            {t.checkout.payment.vietqr}
                                            <p className="text-xs text-muted-foreground mt-1 font-normal">{t.checkout.payment.vietqrDesc}</p>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary (Sticky Right) */}
                    <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
                        <Card className="border-none shadow-sm rounded-none overflow-hidden bg-card">
                            <CardHeader className="border-b border-border py-6">
                                <CardTitle className="text-xl font-medium tracking-tight text-foreground">{t.checkout.orderSummary}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                                    {items.map((item) => (
                                        <div key={item.variantId} className="flex gap-4">
                                            <div className="h-16 w-16 bg-muted flex-shrink-0">
                                                <img 
                                                    src={item.image} 
                                                    alt={typeof item.name === 'string' ? item.name : (item.name[language] || item.name.en)} 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {typeof item.name === 'string' ? item.name : (item.name[language] || item.name.en)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t.cart.quantity}: {item.quantity} × {formatPrice(item.price)}
                                                </p>
                                            </div>
                                            <p className="text-sm font-medium text-foreground">
                                                {formatPrice(item.price * item.quantity)}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="bg-border" />

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{t.checkout.subtotal}</span>
                                        <span className="text-foreground">{formatPrice(totals.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{t.checkout.shipping}</span>
                                        <span className="text-foreground">
                                            {totals.shipping === 0 ? t.checkout.complimentary : formatPrice(totals.shipping)}
                                        </span>
                                    </div>
                                </div>

                                <Separator className="bg-border" />

                                <div className="flex justify-between items-end">
                                    <span className="text-base font-medium text-foreground uppercase tracking-widest">{t.checkout.total}</span>
                                    <span className="text-2xl font-serif text-foreground">
                                        {formatPrice(totals.total)}
                                    </span>
                                </div>

                                <Button 
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-base tracking-widest h-14 rounded-none transition-all duration-300"
                                    onClick={handlePlaceOrder}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? t.checkout.processing : t.checkout.placeOrder}
                                </Button>

                                <p className="text-[10px] text-center text-neutral-400 leading-relaxed pt-2">
                                    {t.checkout.terms}
                                </p>
                            </CardContent>
                        </Card>

                        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                            <div className="space-y-2">
                                <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">{t.checkout.benefits.vip}</div>
                            </div>
                            <div className="space-y-2 border-x border-border">
                                <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">{t.checkout.benefits.warranty}</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">{t.checkout.benefits.returns}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Layout>
);
};

export default CheckoutPage;
