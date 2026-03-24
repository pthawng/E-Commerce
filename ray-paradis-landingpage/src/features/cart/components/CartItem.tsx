import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useStore } from '@/store/useStore';
import { CartItem as CartItemType } from '../types';
import { useCartStore } from '../store/useCartStore';
import { cn } from '@/lib/utils';

interface CartItemProps {
    item: CartItemType;
    layout?: 'drawer' | 'page';
}

export const CartItem = ({ item, layout = 'drawer' }: CartItemProps) => {
    const { language } = useTranslation();
    const { formatPrice } = useStore();
    const { updateQuantity, removeItem } = useCartStore();

    const isPage = layout === 'page';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={cn(
                "group flex gap-4 py-6 border-b border-hairline last:border-none",
                isPage ? "gap-8 py-8" : "gap-4 py-6"
            )}
        >
            {/* Image Container */}
            <div className={cn(
                "relative overflow-hidden bg-secondary/10 flex-shrink-0",
                isPage ? "w-24 h-24 sm:w-32 sm:h-32" : "w-20 h-20"
            )}>
                <img
                    src={item.image}
                    alt={item.name[language]}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
            </div>

            {/* Info Container */}
            <div className="flex flex-col flex-grow min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <h3 className={cn(
                        "font-display text-primary truncate pr-4 italic",
                        isPage ? "text-lg sm:text-xl" : "text-sm sm:text-base leading-tight"
                    )}>
                        {item.name[language] || item.name['en']}
                    </h3>
                    <button 
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-primary transition-colors p-1"
                    >
                        <X size={isPage ? 18 : 14} strokeWidth={1.2} />
                    </button>
                </div>

                {/* Attributes */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
                    {item.attributes.map((attr, i) => (
                        <span key={i} className="font-body text-[10px] uppercase tracking-widest text-muted-foreground">
                            {attr.name}: <span className="text-primary/60">{attr.value}</span>
                        </span>
                    ))}
                </div>

                {/* Price & Quantity Area */}
                <div className="mt-auto flex justify-between items-center">
                    <div className="flex items-center border border-hairline overflow-hidden">
                        <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-secondary/20 transition-colors"
                        >
                            <Minus size={12} strokeWidth={1} />
                        </button>
                        <span className="w-8 text-center font-body text-[10px] tabular-nums">
                            {item.quantity}
                        </span>
                        <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 hover:bg-secondary/20 transition-colors"
                        >
                            <Plus size={12} strokeWidth={1} />
                        </button>
                    </div>
                    
                    <p className={cn(
                        "font-body font-medium tabular-nums",
                        isPage ? "text-base text-primary" : "text-xs text-primary/80"
                    )}>
                        {formatPrice(item.price * item.quantity)}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
