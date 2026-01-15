import { Product } from '../types';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
    product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
    const { language, formatPrice } = useStore();

    // 1. Get localized name
    const name = product.name[language] || Object.values(product.name)[0];

    // 2. Get main image
    // Prioritize thumbnail, then ordered first image, then placeholder
    const thumbnail = product.media.find(m => m.isThumbnail) || product.media[0];
    const imageUrl = thumbnail ? thumbnail.url : '/placeholder.png'; // Todo: Add real placeholder

    // 3. Get Price
    // If product has variants, logic can be complex. For now, use basePrice or price of first variant.
    // In a real app, you might show "From [minPrice]"
    let price = 0;
    if (!product.hasVariants && product.basePrice) {
        price = product.basePrice;
    } else if (product.variants && product.variants.length > 0) {
        price = product.variants[0].price;
    }

    return (
        <Card className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300">
            {/* Image Area */}
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                <img
                    src={imageUrl}
                    alt={name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />
                {/* Quick Add Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button variant="secondary" className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        View Details
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <CardContent className="p-4">
                <h3 className="font-medium text-lg leading-tight line-clamp-2 min-h-[3rem] mb-2" title={name}>
                    {name}
                </h3>
                <p className="text-primary font-bold text-xl">
                    {formatPrice(price)}
                </p>
            </CardContent>

            <CardFooter className="p-4 pt-0">
                <Button className="w-full gap-2 group-hover:bg-primary/90">
                    <ShoppingCart size={16} />
                    Add to Cart
                </Button>
            </CardFooter>
        </Card>
    );
};
