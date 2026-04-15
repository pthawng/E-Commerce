import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useStore } from '@/store/useStore';
import { CartItem } from '../features/cart/components/CartItem';
import { CartConfidence } from '../features/cart/components/CartConfidence';

export const CartPage = () => {
    const { items, totals, clearCart, fetchCart, isHydrated, status } = useCartStore();
    const { t } = useTranslation();
    const { formatPrice } = useStore();
    const { subtotal, shipping, total, isFreeShipping } = totals;

    React.useEffect(() => {
        fetchCart();
        document.title = t('common.meta.cart');
    }, [fetchCart, t]);

    const isEmpty = items.length === 0;
    const isFirstLoad = !isHydrated && status === 'syncing';

    if (isFirstLoad) {
        return (
            <Layout forceHeaderOpaque={true}>
                <div className="pt-24 sm:pt-32 pb-20 min-h-screen">
                    <Container>
                        <div className="animate-pulse space-y-8">
                            <div className="h-12 w-48 bg-secondary/10 rounded" />
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                                <div className="lg:col-span-12 space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-32 bg-secondary/10 rounded" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Container>
                </div>
            </Layout>
        );
    }

    return (
        <Layout forceHeaderOpaque={true}>
            <div className="pt-24 sm:pt-32 pb-20 min-h-screen">
                <Section padding="none">
                    <Container>
                        {/* Header Area */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
                            <div className="space-y-4">
                                <Link to="/collections" className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors group">
                                    <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-1" />
                                    {t('common.actions.continueShopping')}
                                </Link>
                                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-primary italic font-normal tracking-luxury">
                                    {t('cart.title')}
                                </h1>
                            </div>
                            {!isEmpty && (
                                <Button
                                    variant="ghost"
                                    onClick={clearCart}
                                    className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive flex items-center gap-2"
                                >
                                    <Trash2 size={12} strokeWidth={1.5} />
                                    {t('common.actions.clearAll')}
                                </Button>
                            )}
                        </div>

                        {isEmpty ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center py-20 text-center"
                            >
                                <div className="w-24 h-24 rounded-full bg-secondary/5 flex items-center justify-center mb-8 border border-hairline">
                                    <ShoppingBag className="text-muted-foreground/20" size={40} strokeWidth={1} />
                                </div>
                                <p className="font-display text-2xl text-primary/60 mb-8 italic">
                                    {t('cart.empty')}
                                </p>
                                <Link to="/collections">
                                    <Button variant="luxury" className="px-12 h-14">
                                        {t('common.actions.addToCollection')}
                                    </Button>
                                </Link>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
                                {/* Items List */}
                                <div className="lg:col-span-12 xl:col-span-12">
                                    <div className="border-t border-hairline">
                                        <AnimatePresence mode="popLayout">
                                            {items.map((item) => (
                                                <CartItem key={item.variantId} item={item} layout="page" />
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Order Summary (Two column flow on large desktop) */}
                                <div className="lg:col-span-12 xl:col-span-5 xl:col-start-8 mt-12 lg:mt-0">
                                    <div className="sticky top-32 bg-secondary/5 border border-hairline p-6 sm:p-10 space-y-8 shadow-luxury-soft">
                                        <h2 className="font-display text-2xl text-primary italic border-b border-hairline pb-6">
                                            {t('cart.summary')}
                                        </h2>

                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <span className="font-body text-[11px] uppercase tracking-widest text-muted-foreground">
                                                    {t('cart.subtotal')}
                                                </span>
                                                <span className="font-body tabular-nums text-primary">{formatPrice(subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-body text-[11px] uppercase tracking-widest text-muted-foreground">
                                                    {t('cart.shipping')}
                                                </span>
                                                <span className={isFreeShipping ? "text-gold font-body text-[11px] uppercase tracking-widest" : "font-body tabular-nums text-primary"}>
                                                    {isFreeShipping ? t('cart.complimentary') : formatPrice(shipping)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-body text-[11px] uppercase tracking-widest text-muted-foreground">
                                                    {t('cart.tax')}
                                                </span>
                                                <span className="font-body tabular-nums text-primary">{formatPrice(0)}</span>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-hairline flex justify-between items-baseline">
                                            <span className="font-display text-2xl italic text-primary">{t('cart.total')}</span>
                                            <span className="font-body text-3xl font-medium text-primary tabular-nums tracking-tight">
                                                {formatPrice(total)}
                                            </span>
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <Link to="/checkout" className="block w-full">
                                                <Button
                                                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white h-16 rounded-none group text-xs uppercase tracking-widest"
                                                >
                                                    {t('common.actions.checkout')}
                                                    <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
                                                </Button>
                                            </Link>

                                            <CartConfidence />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Container>
                </Section>
            </div>
        </Layout>
    );
};
