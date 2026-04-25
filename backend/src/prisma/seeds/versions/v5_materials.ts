import { PrismaClient } from '@prisma/client';
import { SeedScript } from '../utils/history';

export const v5_materials: SeedScript = {
    version: 'v5',
    name: 'Materials Foundation',
    run: async (prisma: PrismaClient) => {
        // 1. Create Materials Category
        const materialCategory = await prisma.category.upsert({
            where: { slug: 'materials' },
            update: {},
            create: {
                slug: 'materials',
                name: { vi: 'Vật liệu', en: 'Materials' },
                isActive: true,
                order: 10,
            },
        });

        // 2. Create Raw Material Products
        const materials = [
            {
                name: { vi: 'Vàng 24k Bullion', en: 'Gold 24k Bullion' },
                slug: 'gold-24k-bullion',
                price: 2000000, // per gram (mock)
                sku: 'MAT-GOLD-24K',
            },
            {
                name: { vi: 'Bạch kim Nguyên khối', en: 'Platinum Bullion' },
                slug: 'platinum-bullion',
                price: 1500000,
                sku: 'MAT-PLAT-950',
            },
            {
                name: { vi: 'Kim cương 0.5ct VVS1', en: 'Diamond 0.5ct VVS1' },
                slug: 'diamond-05ct-vvs1',
                price: 50000000,
                sku: 'MAT-DIA-05-VVS1',
            },
        ];

        for (const m of materials) {
            const product = await prisma.product.upsert({
                where: { slug: m.slug },
                update: { name: m.name },
                create: {
                    name: m.name,
                    slug: m.slug,
                    hasVariants: false,
                    isActive: true,
                    displayPriceMin: m.price,
                    displayPriceMax: m.price,
                    categories: {
                        create: {
                            categoryId: materialCategory.id,
                        },
                    },
                },
            });

            await prisma.productVariant.upsert({
                where: { sku: m.sku },
                update: { price: m.price },
                create: {
                    productId: product.id,
                    sku: m.sku,
                    price: m.price,
                    isDefault: true,
                    variantTitle: { vi: 'Nguyên liệu', en: 'Raw Material' },
                },
            });
        }
    },
};
