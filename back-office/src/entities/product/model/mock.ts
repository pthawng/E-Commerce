import { JewelryProduct } from './types';

export const MOCK_PRODUCTS: JewelryProduct[] = [
    {
        id: 'p1',
        name: 'Elysian Diamond Halo Ring',
        slug: 'elysian-diamond-halo-ring',
        description: 'A breathtaking 18k white gold ring featuring a central 1.5ct pear-cut diamond surrounded by a halo of brilliant-cut pavé diamonds.',
        collectionId: 'c1',
        category: 'rings',
        basePrice: 4500,
        tags: ['rings', 'diamond', '18k', 'bestseller'],
        variants: [
            {
                id: 'v1',
                sku: 'RP-RNG-ELY-18W-D15-SZ6',
                productId: 'p1',
                material: { type: 'gold', color: 'white', purity: '18k', weightGrams: 4.2 },
                gemstones: [
                    { type: 'Diamond', caratWeight: 1.5, clarity: 'VVS1', colorGrade: 'E', cut: 'Excellent', quantity: 1 },
                    { type: 'Diamond', caratWeight: 0.4, clarity: 'VS1', colorGrade: 'F', cut: 'Ideal', quantity: 24 }
                ],
                size: '6',
                priceModifier: 0,
                stockLevel: 3,
                isActive: true,
            },
            {
                id: 'v2',
                sku: 'RP-RNG-ELY-18R-D15-SZ7',
                productId: 'p1',
                material: { type: 'gold', color: 'rose', purity: '18k', weightGrams: 4.3 },
                gemstones: [
                    { type: 'Diamond', caratWeight: 1.5, clarity: 'VVS1', colorGrade: 'E', cut: 'Excellent', quantity: 1 },
                    { type: 'Diamond', caratWeight: 0.4, clarity: 'VS1', colorGrade: 'F', cut: 'Ideal', quantity: 24 }
                ],
                size: '7',
                priceModifier: 200,
                stockLevel: 1,
                isActive: true,
            }
        ],
        media: [
            { id: 'm1', type: 'image', url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800', alt: 'Elysian Diamond Halo Ring Primary', isPrimary: true }
        ],
        metadata: {
            story: 'Inspired by the celestial light of the Elysian fields.',
            designer: 'Ray Paradis Studio'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'p2',
        name: 'Seraphina Emerald Necklace',
        slug: 'seraphina-emerald-necklace',
        description: 'An exquisite platinum necklace with a cascade of Colombian emeralds and pear-shaped diamonds.',
        collectionId: 'c2',
        category: 'necklaces',
        basePrice: 12000,
        tags: ['necklaces', 'emerald', 'platinum', 'high-jewelry'],
        variants: [
            {
                id: 'v3',
                sku: 'RP-NCK-SER-PLT-EM5',
                productId: 'p2',
                material: { type: 'platinum', color: 'white', purity: '925', weightGrams: 12.5 },
                gemstones: [
                    { type: 'Emerald', caratWeight: 5.2, clarity: 'Fine', quantity: 5 },
                    { type: 'Diamond', caratWeight: 2.1, clarity: 'VVS2', colorGrade: 'F', quantity: 12 }
                ],
                priceModifier: 0,
                stockLevel: 1,
                isActive: true,
            }
        ],
        media: [
            { id: 'm2', type: 'image', url: 'https://images.unsplash.com/photo-1599643477877-51de4ef2879f?auto=format&fit=crop&q=80&w=800', alt: 'Seraphina Emerald Necklace', isPrimary: true }
        ],
        metadata: {
            designer: 'Ray Paradis Studio'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];
