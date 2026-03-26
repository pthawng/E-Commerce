import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ChevronRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiGet } from '@/services/apiClient';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { Layout } from '@/components/layout/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

/**
 * PaymentResultPage
 * Unified page to handle returns from VNPAY and PayPal
 */
export const PaymentResultPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { clearCart } = useCartStore();

    const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'processing'>('loading');
    const [orderInfo, setOrderInfo] = useState<any>(null);

    const orderId = searchParams.get('orderId');
    const vnpStatus = searchParams.get('status'); // From VNPAY redirect
    const paypalToken = searchParams.get('token'); // From PayPal redirect (PayPal Order ID)

    useEffect(() => {
        const checkStatus = async () => {
            let currentOrderId = orderId;

            if (!currentOrderId && !paypalToken && !vnpStatus) {
                setStatus('failed');
                return;
            }

            if (vnpStatus === 'failed') {
                setStatus('failed');
                return;
            }

            // Start polling
            pollOrderStatus(currentOrderId, paypalToken);
        };

        checkStatus();
    }, [orderId, vnpStatus, paypalToken]);

    const pollOrderStatus = async (id: string | null, token: string | null) => {
        const maxRetries = 10;
        const interval = 2000;

        const poll = async (count: number) => {
            try {
                // Find order by orderId or search for payment with paypal token
                const response = await apiGet<any>(`/payment/status/${id || token}`);
                const data = response.data;
                
                setOrderInfo(data);

                if (data.paymentStatus === 'paid') {
                    setStatus('success');
                    clearCart();
                    return;
                }

                if (data.status === 'cancelled' || data.paymentStatus === 'failed') {
                    setStatus('failed');
                    return;
                }

                if (count < maxRetries) {
                    setStatus('processing');
                    setTimeout(() => poll(count + 1), interval);
                } else {
                    setStatus('failed');
                    toast.error(t.checkout.paymentResult.timeout);
                }
            } catch (err) {
                console.error("Polling error:", err);
                if (count < maxRetries) {
                    setTimeout(() => poll(count + 1), interval);
                } else {
                    setStatus('failed');
                }
            }
        };

        poll(0);
    };

    return (
        <Layout forceHeaderOpaque={true}>
            <div className="min-h-[80vh] flex items-center justify-center pt-20 pb-12 bg-background">
                <div className="container max-w-md mx-auto px-4">
                    <Card className="border-none shadow-xl rounded-none overflow-hidden bg-white">
                        <CardContent className="pt-12 pb-8 text-center space-y-6">
                            {status === 'loading' || status === 'processing' ? (
                                <>
                                    <div className="flex justify-center">
                                        <Loader2 className="h-16 w-16 text-primary animate-spin" />
                                    </div>
                                    <div className="space-y-2">
                                        <CardTitle className="text-2xl font-serif">
                                            {status === 'loading' ? t.checkout.paymentResult.verifying : t.checkout.paymentResult.processing}
                                        </CardTitle>
                                        <p className="text-muted-foreground text-sm px-4">
                                            {t.checkout.paymentResult.waitingMessage}
                                        </p>
                                    </div>
                                </>
                            ) : status === 'success' ? (
                                <>
                                    <div className="flex justify-center">
                                        <CheckCircle2 className="h-20 w-20 text-green-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <CardTitle className="text-2xl font-serif text-foreground">
                                            {t.checkout.paymentResult.successTitle}
                                        </CardTitle>
                                        <p className="text-muted-foreground text-sm">
                                            {t.checkout.paymentResult.successSubtitle}
                                        </p>
                                    </div>
                                    {orderInfo && (
                                        <div className="bg-muted/30 p-4 text-left space-y-2 text-sm mt-4 border border-border">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">{t.checkout.paymentResult.orderCode}:</span>
                                                <span className="font-medium">{orderInfo.orderCode}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">{t.cart.total}:</span>
                                                <span className="font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderInfo.totalAmount)}</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-center">
                                        <XCircle className="h-20 w-20 text-red-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <CardTitle className="text-2xl font-serif text-foreground">
                                            {t.checkout.paymentResult.failedTitle}
                                        </CardTitle>
                                        <p className="text-muted-foreground text-sm">
                                            {t.checkout.paymentResult.failedSubtitle}
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3 p-8 border-t border-border bg-muted/10">
                            {status === 'success' ? (
                                <>
                                    <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-none">
                                        <Link to="/collections">
                                            {t.checkout.paymentResult.continueShopping}
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button variant="outline" asChild className="w-full h-12 rounded-none border-border">
                                        <Link to="/profile/orders">
                                            {t.checkout.paymentResult.viewOrders}
                                        </Link>
                                    </Button>
                                </>
                            ) : status === 'failed' ? (
                                <>
                                    <Button asChild className="w-full bg-foreground hover:bg-foreground/90 text-background h-12 rounded-none">
                                        <Link to="/checkout">
                                            {t.checkout.paymentResult.retryPayment}
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" asChild className="w-full h-12 rounded-none">
                                        <Link to="/">
                                            {t.checkout.paymentResult.backToHome}
                                        </Link>
                                    </Button>
                                </>
                            ) : null}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default PaymentResultPage;
