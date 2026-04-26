import React from 'react';
import { motion } from 'framer-motion';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter
} from '@/components/ui/sheet';
import { useCartStore } from '../store/useCartStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useStore } from '@/store/useStore';
import { CartItem } from './CartItem';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { CartConfidence } from './CartConfidence';
import { cn } from '@/lib/utils';

export const CartDrawer = () => {
    const { items, isOpen, setOpen, totals, fetchCart, status } = useCartStore();
    const { t } = useTranslation();
    const { formatPrice } = useStore();
    const { subtotal, shipping, total, isFreeShipping } = totals;

    // Sync latest cart when drawer opens (only on open)
    React.useEffect(() => {
        if (isOpen) {
            fetchCart();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const isEmpty = items.length === 0;
    const isSyncing = status === 'syncing';

    return (
        <Sheet open={isOpen} onOpenChange={setOpen}>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-l border-hairline bg-background/95 backdrop-blur-xl">
                {/* Header */}
                <SheetHeader className="p-6 border-b border-hairline">
                    <SheetTitle className="font-display text-2xl italic font-normal tracking-wide text-primary">
                        {t('cart.title')}
                    </SheetTitle>
                </SheetHeader>

                {/* Body */}
                <div className="flex-grow min-h-0 relative">
                    {isSyncing && (
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-secondary/10 z-20 pointer-events-none overflow-hidden">
                            <motion.div
                                className="h-full bg-gold/30"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                style={{ width: '50%' }}
                            />
                        </div>
                    )}
                    {isEmpty && !isSyncing ? (
                        <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mb-6">
                                <ShoppingBag className="text-muted-foreground/40" size={32} strokeWidth={1} />
                            </div>
                            <h3 className="font-display text-xl text-primary/80 mb-2 italic">
                                {t('cart.empty')}
                            </h3>
                            <Button
                                asChild
                                variant="link"
                                className="text-gold uppercase tracking-widest text-[10px] mt-4 shadow-none hover:no-underline"
                                onClick={() => setOpen(false)}
                            >
                                <Link to="/collections">
                                    {t('common.actions.continueShopping')}
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="h-full px-6">
                            <div className={cn("py-2 transition-opacity duration-300", isSyncing && "opacity-60 pointer-events-none")}>
                                {items.map((item) => (
                                    <CartItem key={item.variantId} item={item} layout="drawer" />
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {/* Footer Center - High Aligned Layout */}
                {!isEmpty && (
                    <SheetFooter className="mt-auto p-6 sm:p-8 border-t border-hairline bg-secondary/[0.02]">
                        <div className={cn("w-full space-y-8 transition-opacity duration-300", isSyncing && "opacity-60")}>
                            {/* Pricing Lifecycle */}
                            <div className="space-y-4">
                                {/* Sub-breakdown */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-body text-muted-foreground uppercase tracking-[0.2em] text-[9px]">
                                            {t('cart.subtotal')}
                                        </span>
                                        <span className="font-body text-primary tabular-nums text-sm font-medium">
                                            {formatPrice(subtotal)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-body text-muted-foreground uppercase tracking-[0.2em] text-[9px]">
                                            {t('cart.shipping')}
                                        </span>
                                        <span className={isFreeShipping ? "text-gold font-body text-[9px] uppercase tracking-[0.1em] font-medium" : "font-body text-primary tabular-nums text-sm font-medium"}>
                                            {isFreeShipping ? t('cart.complimentary') : formatPrice(shipping)}
                                        </span>
                                    </div>
                                </div>

                                {/* Divider Line */}
                                <div className="h-px bg-hairline/50 w-full" />

                                {/* Grand Total */}
                                <div className="flex items-end justify-between pt-1">
                                    <div className="flex flex-col gap-1">
                                        <p className="font-display text-xs italic text-muted-foreground">{t('cart.total')}</p>
                                        <p className="font-body text-[10px] text-muted-foreground/60 uppercase tracking-widest leading-none">Tax included</p>
                                    </div>
                                    <p className="font-body text-3xl sm:text-4xl font-semibold text-primary tabular-nums leading-none tracking-tight">
                                        {formatPrice(total)}
                                    </p>
                                </div>
                            </div>

                            {/* Primary Action & Confidence */}
                            <div className="space-y-6">
                                <Button
                                    asChild
                                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground h-16 rounded-none group shadow-luxury-soft transition-all duration-500"
                                    onClick={() => setOpen(false)}
                                >
                                    <Link to="/checkout" className="flex items-center justify-center gap-4">
                                        <span className="font-body text-[11px] uppercase tracking-[0.3em] font-medium">
                                            {t('common.actions.checkout')}
                                        </span>
                                        <ArrowRight size={16} className="shrink-0 transition-transform duration-500 group-hover:translate-x-2" strokeWidth={1} />
                                    </Link>
                                </Button>

                                <div className="opacity-70">
                                    <CartConfidence />
                                </div>
                            </div>
                        </div>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
};
