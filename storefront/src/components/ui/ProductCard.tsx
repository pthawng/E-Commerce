import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <Card className={cn("group flex flex-col h-full overflow-hidden border-none transition-all duration-700 bg-background shadow-luxury-soft hover:shadow-luxury isolate", className)}>
      <CardHeader className="p-0 relative aspect-square overflow-hidden bg-secondary/10">
        {isNew && (
          <Badge className="absolute top-4 left-4 z-20 bg-gold text-primary hover:bg-gold/90 border-none rounded-full px-3 py-1 text-[10px] uppercase tracking-widest pointer-events-none">
            {t('common.badge.new')}
          </Badge>
        )}
        <motion.img
          src={image}
          alt={name}
          // Optimization: Prioritize the first row (LCP) and lazy-load the rest
          loading={index < 4 ? "eager" : "lazy"}
          decoding="async"
          // @ts-ignore - fetchpriority is a valid experimental attribute for LCP
          fetchpriority={index < 4 ? "high" : "low"}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {hoverImage && (
          <motion.img
            src={hoverImage}
            alt={`${name} secondary view`}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </CardHeader>
      
      <CardContent className="flex flex-col flex-grow p-2 lg:p-3 text-center">
        <p className="font-body text-[9px] lg:text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1 lg:mb-2">
          {category}
        </p>
        <div className="flex-grow flex flex-col justify-center mb-1 lg:mb-2 min-h-[2rem] lg:min-h-[2.5rem]">
          <CardTitle className="font-display text-sm md:text-md lg:text-lg font-normal italic tracking-wide group-hover:text-primary transition-colors duration-500 line-clamp-2">
            {name}
          </CardTitle>
        </div>
        <p className="font-body text-xs lg:text-sm text-primary/80 font-medium tracking-wide">
          {price}
        </p>
      </CardContent>
      
      <CardFooter className="p-2 pt-0 justify-center h-auto min-h-[2.5rem] lg:min-h-0 lg:h-10">
        <div className="flex items-center justify-center gap-x-2 gap-y-2 lg:gap-x-6 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-0 lg:translate-y-2 group-hover:translate-y-0 flex-wrap">
          <Link 
            to={`/product/${slug}`}
            className="font-body text-[9px] lg:text-[10px] uppercase tracking-ultra text-primary/60 border-b border-primary/20 hover:text-gold hover:border-gold transition-all duration-500 pb-1 flex-shrink-0"
          >
            {t('common.actions.quickView')}
          </Link>
          <div className="hidden sm:block w-px h-3 bg-primary/10" />
          <button 
            onClick={handleAddToCart}
            className="font-body text-[9px] lg:text-[10px] uppercase tracking-ultra text-primary hover:text-gold transition-all duration-500 border-b border-transparent hover:border-gold pb-1 flex items-center justify-center gap-2 flex-shrink-0"
          >
            {t('common.actions.addToCollection')}
          </button>
        </div>
      </CardFooter>
    </Card>
  );
});

ProductCard.displayName = "ProductCard";
