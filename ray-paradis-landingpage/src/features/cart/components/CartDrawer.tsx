import React from 'react';
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
                <div className="flex-grow flex flex-col overflow-hidden relative">
                    {isSyncing && items.length > 0 && (
                        <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px] z-10 flex items-center justify-center">
                            <div className="w-1 h-1 bg-gold rounded-full animate-ping" />
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
                        <ScrollArea className="flex-grow px-6">
                            <div className="py-2">
                                {items.map((item) => (
                                    <CartItem key={item.variantId} item={item} layout="drawer" />
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {/* Footer */}
                {!isEmpty && (
                    <SheetFooter className="mt-auto p-6 border-t border-hairline bg-secondary/5 flex-col space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="font-body text-muted-foreground uppercase tracking-widest text-[10px]">
                                    {t.cart.subtotal}
                                </span>
                                <span className="font-body font-medium tabular-nums">{formatPrice(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-body text-muted-foreground uppercase tracking-widest text-[10px]">
                                    {t.cart.shipping}
                                </span>
                                <span className={isFreeShipping ? "text-gold font-body text-[10px] uppercase tracking-widest" : "font-body font-medium tabular-nums"}>
                                    {isFreeShipping ? t.cart.complimentary : formatPrice(shipping)}
                                </span>
                            </div>
                            <div className="pt-3 border-t border-hairline flex justify-between items-baseline">
                                <span className="font-display text-lg italic text-primary">{t.cart.total}</span>
                                <span className="font-body text-xl font-semibold text-primary tabular-nums">
                                    {formatPrice(total)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Button 
                                asChild
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-none group"
                                onClick={() => setOpen(false)}
                            >
                                <Link to="/cart" className="flex items-center justify-center gap-2">
                                    {t.cart.checkout}
                                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
                                </Link>
                            </Button>
                            
                            <CartConfidence />
                        </div>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
};
