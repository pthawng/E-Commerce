import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  AlertCircle,
  Clock,
  RotateCcw,
  MessageCircle,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { Layout } from '@/components/layout/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import { CheckoutService } from '@/features/checkout/services/CheckoutService';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';
import { toast } from 'sonner';

/**
 * Deterministic State Machine for Payment UI
 */
type PaymentUIState = 'INIT' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'UNKNOWN';

interface OrderInfo {
  id: string;
  code: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
}

export const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, formatPrice } = useTranslation();
  const { clearCart } = useCartStore();
  const { user } = useAuthStore();
  const isGuest = !user;

  const [uiState, setUiState] = useState<PaymentUIState>('INIT');
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const abortControllerRef = useRef<AbortController | null>(null);

  const orderId = searchParams.get('orderId');
  const externalStatusHint = searchParams.get('status'); // Optimistic hint (e.g., from VNPAY redirect)
  const paypalToken = searchParams.get('token'); // PayPal fallback

  const effectiveOrderId = orderId || paypalToken;

  /**
   * Observability: Track payment result events
   */
  const trackEvent = useCallback((_event: string, _properties?: Record<string, unknown>) => {
    // Add real tracking library call here, e.g., segment.track(...)
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const handleTerminalState = useCallback((state: PaymentUIState, data?: OrderInfo | null) => {
    stopPolling();
    setUiState(state);
    if (data) setOrderInfo(data);

    if (state === 'SUCCESS') {
      clearCart();
      trackEvent('payment_success', { orderId: effectiveOrderId, amount: data?.totalAmount });
    } else {
      trackEvent('payment_failed', { state, orderId: effectiveOrderId });
    }
  }, [effectiveOrderId, clearCart, stopPolling, trackEvent]);

  const pollStatus = useCallback(async () => {
    if (!effectiveOrderId) {
      setUiState('FAILED');
      return;
    }

    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setElapsedSeconds(elapsed);

    // Hard Stop: Timeout after 30 seconds
    if (elapsed >= 30) {
      handleTerminalState('TIMEOUT');
      return;
    }

    try {
      const data = (await CheckoutService.getPaymentStatus(effectiveOrderId)) as (OrderInfo & { status?: string }) | null;

      // Deterministic Backend Check
      if (data?.paymentStatus === 'paid') {
        handleTerminalState('SUCCESS', data);
        return;
      }

      if (data?.paymentStatus === 'failed' || data?.status === 'cancelled') {
        handleTerminalState('FAILED', data);
        return;
      }

      // Continue Polling: Smart Backoff (Stripe-level)
      // 0-10s: 2s interval
      // 10-30s: 5s interval
      const nextInterval = elapsed < 10 ? 2000 : 5000;
      setUiState('PROCESSING');

      pollingTimerRef.current = setTimeout(pollStatus, nextInterval);
    } catch (err) {
      console.error("Payment status verification error:", err);
      // Don't stop on single network glitch, but track it
      trackEvent('payment_verification_error', { error: err });

      // If error persists beyond timeout, it will naturally become TIMEOUT
      pollingTimerRef.current = setTimeout(pollStatus, 5000);
    }
  }, [effectiveOrderId, handleTerminalState, trackEvent]);

  useEffect(() => {
    // Initialization & Safety Checks
    if (!effectiveOrderId) {
      setUiState('FAILED');
      return;
    }

    // Start Polling
    startTimeRef.current = Date.now();
    pollStatus();

    // Cleanup on unmount (Memory leak prevention)
    return () => stopPolling();
  }, [effectiveOrderId, pollStatus, stopPolling]);

  // Luxury Easing for Framer Motion
  const luxuryEasing: [number, number, number, number] = [0.16, 1, 0.3, 1];
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: luxuryEasing } }
  };

  return (
    <Layout forceHeaderOpaque={true}>
      <div className="min-h-[90vh] flex items-center justify-center pt-24 pb-16 bg-[#fcf9f8] dark:bg-[#121212]">
        <motion.div
          className="container max-w-lg mx-auto px-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <Card className="border-none shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] rounded-none overflow-hidden bg-white dark:bg-[#1c1b1b]">
            <CardContent className="pt-16 pb-12 text-center space-y-8">
              <AnimatePresence mode="wait">
                {uiState === 'PROCESSING' || uiState === 'INIT' ? (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-8"
                  >
                    <div className="flex justify-center relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 border-t-2 border-primary/20 rounded-full animate-spin duration-[3000ms]" />
                      </div>
                      <Loader2 className="h-12 w-12 text-primary animate-spin" strokeWidth={1.2} />
                    </div>

                    <div className="space-y-3 px-8">
                      <h1 className="text-3xl font-serif italic text-foreground tracking-tight">
                        {externalStatusHint === 'success' ? t('checkout.paymentResult.optimisticSuccess') : t('checkout.paymentResult.processing')}
                      </h1>
                      <p className="text-muted-foreground text-sm font-light leading-relaxed">
                        {t('checkout.paymentResult.waitingMessage')}
                      </p>
                    </div>

                    {elapsedSeconds > 15 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-muted/30 p-4 border border-border/50 mx-8 flex items-center gap-3 text-left"
                      >
                        <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                        <span className="text-xs text-muted-foreground italic">
                          {t('checkout.paymentResult.timeoutSubtitle')}
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                ) : uiState === 'SUCCESS' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8"
                  >
                    <div className="flex justify-center">
                      <div className="relative">
                        <motion.div
                          className="absolute inset-0 bg-green-500/10 rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <CheckCircle2 className="h-20 w-20 text-[#D4AF37]" strokeWidth={1} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h1 className="text-4xl font-serif italic text-foreground tracking-tight">
                        {t('checkout.paymentResult.successTitle')}
                      </h1>
                      <p className="text-muted-foreground text-sm font-light">
                        {t('checkout.paymentResult.successSubtitle')}
                      </p>
                    </div>

                    {orderInfo && (
                      <div className="mx-8 p-6 bg-[#fcf9f8] dark:bg-[#1a1a1a] border border-border/40 text-left space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-border/20">
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                            {t('checkout.paymentResult.orderCode')}
                          </span>
                          <span className="font-medium text-sm">#{orderInfo.code}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-border/20">
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                            {t('checkout.paymentResult.amount')}
                          </span>
                          <span className="font-semibold text-sm">
                            {formatPrice(orderInfo.totalAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                            {t('checkout.paymentResult.paymentMethod')}
                          </span>
                          <span className="text-sm font-medium uppercase tracking-tight">
                            {orderInfo.paymentMethod === 'VNPAY' ? t('checkout.payment.vnpay') :
                             orderInfo.paymentMethod === 'PAYPAL' ? t('checkout.payment.paypal') :
                             orderInfo.paymentMethod === 'VIETQR' ? t('checkout.payment.vietqr') :
                             orderInfo.paymentMethod || t('checkout.paymentResult.defaultPayment')}
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="failed"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8"
                  >
                    <div className="flex justify-center">
                      {uiState === 'TIMEOUT' ? (
                        <Clock className="h-20 w-20 text-amber-500" strokeWidth={1} />
                      ) : (
                        <XCircle className="h-20 w-20 text-destructive" strokeWidth={1} />
                      )}
                    </div>

                    <div className="space-y-3 px-8">
                      <h1 className="text-3xl font-serif italic text-foreground tracking-tight">
                        {uiState === 'TIMEOUT' ? t('checkout.paymentResult.timeoutTitle') :
                          uiState === 'UNKNOWN' ? t('checkout.paymentResult.unknownTitle') :
                            t('checkout.paymentResult.failedTitle')}
                      </h1>
                      <p className="text-muted-foreground text-sm font-light leading-relaxed">
                        {uiState === 'TIMEOUT' ? t('checkout.paymentResult.timeoutSubtitle') :
                          uiState === 'UNKNOWN' ? t('checkout.paymentResult.unknownSubtitle') :
                            t('checkout.paymentResult.failedSubtitle')}
                      </p>
                    </div>

                    {(uiState === 'TIMEOUT' || uiState === 'UNKNOWN') && (
                      <div className="mx-8 p-4 bg-amber-500/5 border border-amber-500/20 text-left space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <span className="text-[10px] uppercase tracking-widest font-semibold text-amber-600">
                            {t('checkout.paymentResult.supportInfo')}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                          {t('checkout.paymentResult.supportHint')}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 p-12 pt-0">
              <div className="grid w-full gap-3">
                {uiState === 'SUCCESS' ? (
                  <>
                    {!isGuest && (
                      <Button asChild size="lg" className="h-14 bg-[#1c1b1b] hover:bg-[#2a2929] text-white rounded-none tracking-widest uppercase text-[11px] font-semibold transition-all duration-500">
                        <Link to="/profile/orders">
                          {t('checkout.paymentResult.viewOrders')}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant={isGuest ? "default" : "ghost"} asChild size="lg" className={`h-14 rounded-none tracking-widest uppercase text-[11px] font-semibold ${isGuest ? 'bg-[#1c1b1b] text-white' : 'text-muted-foreground hover:bg-transparent hover:text-foreground'}`}>
                      <Link to="/collections">
                        {t('checkout.paymentResult.continueShopping')}
                        {isGuest && <ChevronRight className="ml-2 h-4 w-4" />}
                      </Link>
                    </Button>
                  </>
                ) : uiState !== 'PROCESSING' && uiState !== 'INIT' ? (
                  <>
                    <Button size="lg" onClick={() => navigate('/checkout')} className="h-14 bg-[#1c1b1b] hover:bg-[#2a2929] text-white rounded-none tracking-widest uppercase text-[11px] font-semibold">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {t('checkout.paymentResult.retryPayment')}
                    </Button>

                    {uiState === 'TIMEOUT' || uiState === 'UNKNOWN' ? (
                      <Button variant="outline" size="lg" className="h-14 border-border rounded-none tracking-widest uppercase text-[11px] font-semibold gap-2">
                        <MessageCircle className="h-4 w-4" />
                        {t('checkout.paymentResult.contactSupport')}
                      </Button>
                    ) : (
                      <Button variant="outline" asChild size="lg" className="h-14 border-border rounded-none tracking-widest uppercase text-[11px] font-semibold">
                        <Link to="/checkout?method=change">
                          {t('checkout.paymentMethod')}
                        </Link>
                      </Button>
                    )}

                    <Button variant="ghost" asChild size="lg" className="h-14 rounded-none tracking-widest uppercase text-[11px] font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground">
                      <Link to="/">
                        {t('checkout.paymentResult.backToHome')}
                      </Link>
                    </Button>
                  </>
                ) : null}
              </div>

              <div className="flex justify-center pt-4 opacity-30">
                <div className="flex items-center gap-2">
                  <div className="h-px w-8 bg-muted-foreground" />
                  <span className="text-[10px] tracking-[0.2em] font-light">RAY PARADIS</span>
                  <div className="h-px w-8 bg-muted-foreground" />
                </div>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PaymentResultPage;
