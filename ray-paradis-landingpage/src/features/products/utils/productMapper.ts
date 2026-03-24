import { Product, LocalizedString } from '../types';

/**
 * Helper to get localized string based on current language
 */
export const getLocalized = (str: LocalizedString | undefined, lang: string): string => {
    if (!str) return '';
    return str[lang] || str['en'] || Object.values(str)[0] || '';
};

/**
 * Product Mapper
 * Transforms Backend Product model to Frontend Display model
 */
export const mapProductToCardProps = (
    product: Product, 
    lang: string, 
    formatPrice: (price: number) => string
) => {
    // 1. Get Thumbnail
    const thumbnail = product.media.find(m => m.isThumbnail) || product.media[0];
    const hoverMedia = product.media.find(m => !m.isThumbnail) || product.media[1];

    // 2. Get Primary Category
    const categoryObj = product.categories?.[0]?.category;
    const categoryName = categoryObj ? getLocalized(categoryObj.name, lang) : 'Luxury';

    // 3. Handle Price
    const rawPrice = product.displayPriceMin || product.variants?.[0]?.price || 0;

    return {
        id: product.id,
        name: getLocalized(product.name, lang),
        price: formatPrice(rawPrice),
        category: categoryName,
        image: thumbnail?.url || '',
        hoverImage: hoverMedia?.url,
        isNew: product.isFeatured || false,
        slug: product.slug
    };
};
