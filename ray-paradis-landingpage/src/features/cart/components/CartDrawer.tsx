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
                        {t.cart.title}
                    </SheetTitle>
                </SheetHeader>

                {/* Body */}
                <div className="flex-grow min-h-0 relative">
                    {isSyncing && items.length > 0 && (
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
                                {t.cart.empty}
                            </h3>
                            <Button 
                                asChild
                                variant="link" 
                                className="text-gold uppercase tracking-widest text-[10px] mt-4 shadow-none hover:no-underline"
                                onClick={() => setOpen(false)}
                            >
                                <Link to="/collections">
                                    {t.cart.continueShopping}
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="h-full px-6">
                            <div className="py-2">
                                {items.map((item) => (
                                    <CartItem key={item.variantId} item={item} layout="drawer" />
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {/* Footer Center - High Aligned Layout */}
                {!isEmpty && (
                    <SheetFooter className="mt-auto p-5 sm:p-7 border-t border-hairline bg-secondary/[0.01] flex-col space-y-0">
                        <div className="flex items-start justify-between gap-6">
                            {/* Left: Primary Action & Confidence */}
                            <div className="flex-[3] space-y-4">
                                <Button 
                                    asChild
                                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground h-16 rounded-none group shadow-luxury-soft"
                                    onClick={() => setOpen(false)}
                                >
                                    <Link to="/checkout" className="flex items-center justify-center gap-3">
                                        <span className="font-body text-[11px] uppercase tracking-[0.25em] font-medium truncate">
                                            {t.cart.checkout}
                                        </span>
                                        <ArrowRight size={14} className="shrink-0 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
                                    </Link>
                                </Button>
                                
                                <div className="pl-1 opacity-80">
                                    <CartConfidence />
                                </div>
                            </div>

                            {/* Right: Full Pricing Lifecycle */}
                            <div className="flex-[2] flex flex-col items-end text-right">
                                {/* Sub-breakdown */}
                                <div className="space-y-1 mb-6">
                                    <div className="flex flex-col items-end">
                                        <span className="font-body text-muted-foreground uppercase tracking-[0.15em] text-[8px] leading-none mb-1">
                                            {t.cart.subtotal}
                                        </span>
                                        <span className="font-body text-primary tabular-nums text-sm font-medium leading-none">
                                            {formatPrice(subtotal)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end pt-2">
                                        <span className="font-body text-muted-foreground uppercase tracking-[0.15em] text-[8px] leading-none mb-1">
                                            {t.cart.shipping}
                                        </span>
                                        <span className={isFreeShipping ? "text-gold font-body text-[8px] uppercase tracking-[0.1em] font-medium leading-none" : "font-body text-primary tabular-nums text-sm font-medium leading-none"}>
                                            {isFreeShipping ? t.cart.complimentary : formatPrice(shipping)}
                                        </span>
                                    </div>
                                </div>

                                {/* Divider Line (Minimal) */}
                                <div className="w-8 h-px bg-hairline mb-4" />

                                {/* Grand Total */}
                                <div className="flex flex-col items-end">
                                    <p className="font-display text-xs italic text-muted-foreground mb-1 leading-none">{t.cart.total}</p>
                                    <p className="font-body text-3xl font-semibold text-primary tabular-nums tracking-tighter leading-none">
                                        {formatPrice(total)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
};
