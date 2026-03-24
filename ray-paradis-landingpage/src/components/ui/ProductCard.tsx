import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useCartStore } from "@/features/cart/store/useCartStore";

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
  className?: string;
}

export const ProductCard = ({
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
  className,
}: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const idToUse = variantId || id;
    if (idToUse) {
      addItem(idToUse, 1, {
        productId: id,
        name: { en: name }, 
        price: rawPrice || 0,
        image: image,
        slug: slug
      });
    }
  };

  return (
    <Card className={cn("group flex flex-col h-full overflow-hidden border-none transition-all duration-700 bg-background shadow-luxury-soft hover:shadow-luxury", className)}>
      {/* ... previous content ... */}
      <CardHeader className="p-0 relative aspect-[4/5] overflow-hidden bg-secondary/10">
        {isNew && (
          <Badge className="absolute top-4 left-4 z-20 bg-gold text-primary hover:bg-gold/90 border-none rounded-full px-3 py-1 text-[10px] uppercase tracking-widest pointer-events-none">
            New
          </Badge>
        )}
        <motion.img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        {hoverImage && (
          <motion.img
            src={hoverImage}
            alt={`${name} secondary view`}
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-1000 group-hover:opacity-100"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </CardHeader>
      
      <CardContent className="flex flex-col flex-grow p-6 text-center">
        <p className="font-body text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
          {category}
        </p>
        <div className="min-h-[4rem] flex flex-col justify-center mb-4">
          <CardTitle className="font-display text-xl sm:text-2xl font-normal italic tracking-wide group-hover:text-primary transition-colors duration-500 line-clamp-2">
            {name}
          </CardTitle>
        </div>
        <p className="mt-auto font-body text-sm text-primary/80 font-medium tracking-wide">
          {price}
        </p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 justify-center h-14">
        <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-2 group-hover:translate-y-0">
          <Link 
            to={`/product/${slug}`}
            className="font-body text-[10px] uppercase tracking-ultra text-primary/60 border-b border-primary/20 hover:text-gold hover:border-gold transition-all duration-500 pb-1"
          >
            Quick View
          </Link>
          <div className="w-px h-3 bg-primary/10" />
          <button 
            onClick={handleAddToCart}
            className="font-body text-[10px] uppercase tracking-ultra text-primary hover:text-gold transition-all duration-500 border-b border-transparent hover:border-gold pb-1 flex items-center gap-2"
          >
            Add to Cart
          </button>
        </div>
      </CardFooter>
    </Card>
  );
};
