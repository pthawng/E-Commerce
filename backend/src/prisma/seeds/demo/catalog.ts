import { MediaType, PrismaClient } from '@prisma/client';

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export async function seedCatalog(prisma: PrismaClient) {
  const categoryData = await prisma.category.findMany();
  const categoryMap = new Map(categoryData.map((c) => [c.slug, c]));

  const prefixes = [
    'Celestial',
    'Midnight',
    'Aurora',
    'Eternal',
    'Royal',
    'Lumina',
    'Gilded',
    'Ethereal',
    'Ancient',
    'Infinite',
  ];
  const nouns = [
    'Aura',
    'Bloom',
    'Drops',
    'Empire',
    'Solstice',
    'Link',
    'Tear',
    'Glow',
    'Crown',
    'Crest',
  ];
  const categoryImages: Record<string, string[]> = {
    rings: [
      '1589674781759-c21c37956a44',
      '1543294001-f7cd5d7fb516',
      '1605100804763-247f67b3557e',
      '1613945408026-6732d875e701',
      '1586104237516-5b7075e00d45',
      '1561995734-ef4b62bb6586',
    ],
    necklaces: [
      '1588444968576-f8fe92ce56fd',
      '1635767798638-3e25273a8236',
      '1611012844392-f4f96c7fd052',
      '1705326453292-f3d35cd96514',
      '1729518969028-474518ecde50',
      '1635767798638-3e25273a8236',
    ],
    bracelets: [
      '1573408301185-9146fe634ad0',
      '1611107683227-e9060eccd846',
      '1689397136362-dce64e557fcc',
      '1663243818736-2b7148eeb2f5',
      '1691370298583-4364b396e1e3',
      '1639065643006-e217c4fee12e',
    ],
    earrings: [
      '1629224316810-9d8805b95e76',
      '1588444650733-d0767b753fc8',
      '1535632787350-4e68ef0ac584',
      '1665159882377-385d68d2bdff',
      '1680181362119-5c9bf196805f',
      '1674329042475-de1a95b4ca62',
      '1769151591224-2eee6793b885',
    ],
  };

  const allImages = [
    ...categoryImages.rings.map((id) => ({ id, slug: 'rings' })),
    ...categoryImages.necklaces.map((id) => ({ id, slug: 'necklaces' })),
    ...categoryImages.bracelets.map((id) => ({ id, slug: 'bracelets' })),
    ...categoryImages.earrings.map((id) => ({ id, slug: 'earrings' })),
  ];

  console.log('📦 Generating 24 Mock Products...');

  for (let i = 0; i < allImages.length; i++) {
    const imageData = allImages[i];
    const categorySlug = imageData.slug;
    const imageId = imageData.id;

    const prefix = prefixes[i % prefixes.length];
    const noun = nouns[(i * 3) % nouns.length];
    const category = categoryMap.get(categorySlug)!;
    const catNameEN = (category.name as any).en || 'Jewelry';
    const catNameVI = (category.name as any).vi || 'Trang sức';

    const productNameEN = `${prefix} ${noun}`;
    const productNameVI = `${catNameVI} ${prefix} ${noun}`;
    const slug = slugify(`${productNameEN}-${i + 1}`);
    const basePrice = Math.floor(Math.random() * 50000000) + 5000000;
    const imageUrl = `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&q=80&w=1200`;

    // Root Entity First
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name: { en: productNameEN, vi: productNameVI },
        description: {
          en: `<p>Handcrafted ${productNameEN} ${catNameEN.toLowerCase()} from the Ray Paradis premium collection.</p>`,
          vi: `<p>${productNameVI} được chế tác thủ công từ bộ sưu tập cao cấp của Ray Paradis.</p>`,
        },
      },
      create: {
        name: { en: productNameEN, vi: productNameVI },
        slug,
        description: {
          en: `<p>Handcrafted ${productNameEN} ${catNameEN.toLowerCase()} from the Ray Paradis premium collection.</p>`,
          vi: `<p>${productNameVI} được chế tác thủ công từ bộ sưu tập cao cấp của Ray Paradis.</p>`,
        },
        displayPriceMin: basePrice,
        displayPriceMax: basePrice + 1000000,
        isActive: true,
        isFeatured: i < 5,
      },
    });

    // Relations handled separately (surgical updates)
    // 1. Categories
    await prisma.productCategory.upsert({
      where: {
        productId_categoryId: {
          productId: product.id,
          categoryId: category.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        categoryId: category.id,
      },
    });

    // 2. Variants (Only if none exist)
    const existingVariants = await prisma.productVariant.findMany({
      where: { productId: product.id },
    });
    if (existingVariants.length === 0) {
      await prisma.productVariant.createMany({
        data: [
          {
            productId: product.id,
            sku: `${slug.toUpperCase()}-01`,
            price: basePrice,
            variantTitle: { en: 'Silver Edition', vi: 'Phiên bản Bạc' },
            isDefault: true,
            thumbnailUrl: imageUrl,
          },
          {
            productId: product.id,
            sku: `${slug.toUpperCase()}-02`,
            price: basePrice + 1000000,
            variantTitle: { en: 'Gold Edition', vi: 'Phiên bản Vàng' },
            thumbnailUrl: imageUrl,
          },
        ],
      });
    }

    // 3. Media (Update existing to fix broken images)
    const existingMedia = await prisma.productMedia.findMany({ where: { productId: product.id } });
    if (existingMedia.length === 0) {
      await prisma.productMedia.create({
        data: {
          productId: product.id,
          url: imageUrl,
          type: MediaType.image,
          isThumbnail: true,
        },
      });
    } else {
      // Force update first media if it matches our thumbnail
      await prisma.productMedia.updateMany({
        where: { productId: product.id, isThumbnail: true },
        data: { url: imageUrl },
      });
    }

    // Force update variants thumbnail too
    await prisma.productVariant.updateMany({
      where: { productId: product.id },
      data: { thumbnailUrl: imageUrl },
    });

    if (i % 10 === 0) console.log(`...Synced ${i}/24 products`);
  }
}
