import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useCartStore } from "@/features/cart/store/useCartStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useStore } from "@/store/useStore";

interface ProductCardProps {
  id: string;
  variantId?: string;
  name: string;
  price: string;
  rawPrice?: number;
  category: string;
  image: string;
  slug: string;
  hoverImage?: string;
  isNew?: boolean;
  index?: number;
  className?: string;
}

export const ProductCard = React.memo(({
  id,
  variantId,
  name,
  price,
  rawPrice,
  category,
  image,
  slug,
  hoverImage,
  isNew,
  index = 0,
  className,
}: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const { t } = useTranslation();
  const { language } = useStore();

  const priceNum = rawPrice || 0;
  // Thresholds adjusted for demo data (10M - 90M) to demonstrate the hybrid UI.
  // In production, these would be 125M ($5k) and 1.25B ($50k).
  const isHighTier = priceNum >= 80000000; 
  const isMidTier = priceNum >= 50000000 && priceNum < 80000000;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isHighTier) return; // High tier cannot be added to cart directly
    
    const idToUse = variantId || id;
    if (idToUse) {
      addItem(idToUse, 1, {
        productId: id,
        name: { [language]: name },
        price: rawPrice || 0,
        image: image,
        slug: slug
      });
    }
  };

  const handleInquire = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // This would open a VIP Concierge Modal
    window.dispatchEvent(new CustomEvent('open-concierge-modal', { detail: { productId: id, name } }));
  };

  return (
    <Card className={cn("group flex flex-col h-full overflow-hidden border-none bg-transparent shadow-none isolate", className)}>
      <CardHeader className="p-0 relative aspect-[4/5] overflow-hidden bg-secondary/5 rounded-sm">
        {isNew && (
          <Badge className="absolute top-4 left-4 z-20 bg-background/80 backdrop-blur-md text-primary border-none rounded-sm px-4 py-1.5 text-[9px] uppercase tracking-[0.3em] pointer-events-none">
            {t('common.badge.new')}
          </Badge>
        )}
        <motion.img
          src={image}
          alt={name}
          loading={index < 4 ? "eager" : "lazy"}
          decoding="async"
          // @ts-ignore
          fetchpriority={index < 4 ? "high" : "low"}
          className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
        />
        {hoverImage && (
          <motion.img
            src={hoverImage}
            alt={t('common.actions.secondaryView', { name })}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-1000 ease-in-out group-hover:opacity-100"
          />
        )}
        
        {/* Subtle vignette shadow on hover instead of hard borders */}
        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.03)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

        {/* Hover Actions Overlay (Blur Structure) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col gap-2 z-20">
          <Link
            to={`/product/${slug}`}
            className="w-full py-3 bg-background/80 backdrop-blur-md text-primary font-body text-[10px] uppercase tracking-widest text-center hover:bg-primary hover:text-primary-foreground transition-colors duration-500"
          >
            {t('common.actions.quickView')}
          </Link>

          {isHighTier ? (
            <button
              onClick={handleInquire}
              className="w-full py-3 bg-primary text-primary-foreground font-body text-[10px] uppercase tracking-widest text-center hover:bg-primary/90 transition-colors duration-500"
            >
              {t('shop.pdp.inquireToPurchase')}
            </button>
          ) : isMidTier ? (
            <div className="flex gap-2">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3 bg-background/80 backdrop-blur-md text-primary font-body text-[10px] uppercase tracking-widest text-center hover:bg-background transition-colors duration-500"
              >
                {t('shop.pdp.addToCollection')}
              </button>
              <button
                onClick={handleInquire}
                className="flex-1 py-3 bg-primary text-primary-foreground font-body text-[10px] uppercase tracking-widest text-center hover:bg-primary/90 transition-colors duration-500"
              >
                {t('shop.pdp.contactConcierge')}
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full py-3 bg-background/80 backdrop-blur-md text-primary font-body text-[10px] uppercase tracking-widest text-center hover:bg-primary hover:text-primary-foreground transition-colors duration-500"
            >
              {t('shop.pdp.addToCollection')}
            </button>
          )}
        </div>
        
        {/* Subtle gradient to make text readable on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      </CardHeader>

      <CardContent className="flex flex-col pt-5 pb-0 px-1 text-center bg-transparent">
        <p className="font-body text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
          {category}
        </p>
        <CardTitle className="font-display text-base md:text-lg font-normal italic tracking-wide group-hover:text-gold transition-colors duration-500 mb-2">
          {name}
        </CardTitle>
        <p className="font-body text-xs text-primary/80 tracking-widest">
          {isHighTier ? <span className="italic opacity-70">{t('shop.pdp.priceUponRequest')}</span> : price}
        </p>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = "ProductCard";
