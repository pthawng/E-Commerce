import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  category: string;
  image: string;
  hoverImage?: string;
  isNew?: boolean;
  className?: string;
}

export const ProductCard = ({
  name,
  price,
  category,
  image,
  hoverImage,
  isNew,
  className,
}: ProductCardProps) => {
  return (
    <Card className={cn("group overflow-hidden border-none transition-all duration-700", className)}>
      <CardHeader className="p-0 relative aspect-[3/4] overflow-hidden">
        {isNew && (
          <Badge className="absolute top-4 left-4 z-20 bg-gold text-primary hover:bg-gold/90 border-none rounded-full px-3 py-1 text-[10px] uppercase tracking-widest">
            New
          </Badge>
        )}
        <motion.img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
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
      
      <CardContent className="p-6 text-center">
        <p className="font-body text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
          {category}
        </p>
        <CardTitle className="font-display text-2xl mb-2 font-normal italic tracking-wide group-hover:text-primary transition-colors duration-500">
          {name}
        </CardTitle>
        <p className="font-body text-sm text-primary/80 font-medium">
          {price}
        </p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-2 group-hover:translate-y-0">
        <button className="font-body text-[11px] uppercase tracking-ultra text-primary/60 border-b border-primary/20 hover:text-gold hover:border-gold transition-all duration-500 pb-1">
          Quick View
        </button>
      </CardFooter>
    </Card>
  );
};
