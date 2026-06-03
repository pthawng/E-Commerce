import { Product } from "../types";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/features/cart/store/useCartStore";
import { useState } from "react";
import { useVisibilityStore } from "@/store/useVisibilityStore";
import { getProductThumbnail, type ProductMediaOwnerLike } from "@shared";
import { reportBrokenProductMedia } from "../utils/mediaReport";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { language, formatPrice } = useStore();
  const addItem = useCartStore((state) => state.addItem);
  const [hasError, setHasError] = useState(false);

  // 1. Get localized name
  const name = product.name[language] || Object.values(product.name)[0];

  // 2. Get main image
  const imageUrl =
    getProductThumbnail(product as ProductMediaOwnerLike).url || "";

  // 3. Get Price (Prefer displayPriceMin, fallback to first variant)
  const price = product.displayPriceMin || product.variants?.[0]?.price || 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const variantId =
      product.variants?.find((v) => v.isDefault)?.id ||
      product.variants?.[0]?.id;
    if (variantId) {
      addItem(variantId, 1, {
        productId: product.id,
        name: product.name,
        price: price,
        image: imageUrl,
        slug: product.slug,
      });
    }
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    if (!hasError) {
      setHasError(true);
      const reportInvalidProduct =
        useVisibilityStore.getState().reportInvalidProduct;
      reportInvalidProduct(product.id);
      reportBrokenProductMedia(product.id, e.currentTarget.src);
    }
  };

  if (hasError) return null;

  return (
    <Card className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300">
      {/* Image Area */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={handleImageError}
        />
        {/* Quick Add Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button
            variant="secondary"
            className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
          >
            View Details
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <CardContent className="p-4">
        <h3
          className="font-medium text-lg leading-tight line-clamp-2 min-h-[3rem] mb-2"
          title={name}
        >
          {name}
        </h3>
        <p className="text-primary font-bold text-xl">{formatPrice(price)}</p>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          className="w-full gap-2 group-hover:bg-primary/90"
        >
          <ShoppingCart size={16} />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};
