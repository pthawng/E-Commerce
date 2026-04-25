export interface JewelryProduct {
    id: string;
    name: string;
    slug: string;
    description: string;
    collectionId: string;
    category: 'rings' | 'necklaces' | 'bracelets' | 'earrings' | 'bespoke';
    basePrice: number;
    tags: string[];
    variants: JewelryVariant[];
    media: MediaAsset[];
    metadata: {
        story?: string;
        careInstructions?: string;
        designer?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface JewelryVariant {
    id: string;
    sku: string;
    productId: string;
    material: JewelryMaterial;
    gemstones: GemstoneAttribute[];
    size?: string;
    priceModifier: number; // Final price = basePrice + priceModifier
    stockLevel: number;
    isActive: boolean;
}

export type JewelryMaterial = {
    type: 'gold' | 'silver' | 'platinum';
    color: 'yellow' | 'white' | 'rose';
    purity: '10k' | '14k' | '18k' | '24k' | '925';
    weightGrams?: number;
};

export type GemstoneAttribute = {
    type: string; // e.g., "Diamond", "Sapphire"
    clarity?: string; // e.g., "VS1", "VVS2"
    colorGrade?: string; // e.g., "D", "E", "F"
    cut?: string; // e.g., "Excellent", "Ideal"
    caratWeight: number;
    quantity: number;
};

export interface MediaAsset {
    id: string;
    type: 'image' | 'video' | '3d';
    url: string;
    alt: string;
    isPrimary: boolean;
    metadata?: {
        width?: number;
        height?: number;
        duration?: number;
        format?: string;
    };
}
