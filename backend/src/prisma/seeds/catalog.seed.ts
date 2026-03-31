import { PrismaClient, MediaType } from '@prisma/client';

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
  console.log('🚀 Seeding Catalog (50 Products Factory)...');

  // 1. Attributes (Ids are stable because of code)
  await prisma.attribute.upsert({
    where: { code: 'material' },
    update: {},
    create: {
      code: 'material',
      name: { vi: 'Chất liệu', en: 'Material' },
      values: {
        create: [
          { value: { vi: 'Vàng 18k', en: '18k Gold' }, metaValue: '#D4AF37' },
          { value: { vi: 'Bạch kim', en: 'Platinum' }, metaValue: '#E5E4E2' },
          { value: { vi: 'Kim Cương', en: 'Diamond' }, metaValue: '#FFFFFF' },
        ]
      }
    }
  });

  // 2. Categories
  const categoryData = [
    { name: 'Rings', vi: 'Nhẫn', slug: 'rings' },
    { name: 'Necklaces', vi: 'Vòng cổ', slug: 'necklaces' },
    { name: 'Bracelets', vi: 'Lắc tay', slug: 'bracelets' },
    { name: 'Earrings', vi: 'Bông tai', slug: 'earrings' },
  ];

  const categoryMap = new Map();
  for (const c of categoryData) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: { en: c.name, vi: c.vi } },
      create: { 
        slug: c.slug, 
        name: { en: c.name, vi: c.vi },
        isActive: true 
      },
    });
    categoryMap.set(c.slug, cat.id);
  }

  // 3. Jewelry Factory (50 Products)
  const prefixes = ['Celestial', 'Midnight', 'Aurora', 'Eternal', 'Royal', 'Lumina', 'Gilded', 'Ethereal', 'Ancient', 'Infinite'];
  const nouns = ['Aura', 'Bloom', 'Drops', 'Empire', 'Solstice', 'Link', 'Tear', 'Glow', 'Crown', 'Crest'];
  const baseImages = [
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908',
  ];

  for (let i = 1; i <= 50; i++) {
    const prefix = prefixes[i % prefixes.length];
    const noun = nouns[(i * 3) % nouns.length];
    const categorySlug = categoryData[i % categoryData.length].slug;
    const productNameEN = `${prefix} ${noun} ${categorySlug.slice(0, -1)}`;
    const productNameVI = `${noun} ${prefix} (Dòng ${categoryData[i % categoryData.length].vi})`;
    const slug = slugify(`${productNameEN}-${i}`);
    const basePrice = Math.floor(Math.random() * 50000000) + 5000000;
    const imageUrl = `${baseImages[i % baseImages.length]}?auto=format&fit=crop&q=80&w=800`;

    // Data structure for sub-records
    const subRecords = {
      categories: { create: { categoryId: categoryMap.get(categorySlug) } },
      variants: {
        create: [
          { 
            sku: `${slug.toUpperCase()}-01`, 
            price: basePrice, 
            variantTitle: { en: 'Silver Edition', vi: 'Phiên bản Bạc' },
            isDefault: true,
            thumbnailUrl: imageUrl
          },
          { 
            sku: `${slug.toUpperCase()}-02`, 
            price: basePrice + 1000000, 
            variantTitle: { en: 'Gold Edition', vi: 'Phiên bản Vàng' },
            thumbnailUrl: imageUrl
          },
        ]
      },
      media: {
        create: { url: imageUrl, type: MediaType.image, isThumbnail: true }
      }
    };

    await prisma.product.upsert({
      where: { slug },
      update: {
        name: { en: productNameEN, vi: productNameVI },
        displayPriceMin: basePrice,
        displayPriceMax: basePrice + 1000000,
        // Reset and Re-create for idempotency
        variants: { deleteMany: {}, create: subRecords.variants.create },
        categories: { deleteMany: {}, create: subRecords.categories.create },
        media: { deleteMany: {}, create: subRecords.media.create },
      },
      create: {
        name: { en: productNameEN, vi: productNameVI },
        slug,
        description: { 
          en: `<p>Handcrafted ${productNameEN} from the Ray Paradis premium collection.</p>`, 
          vi: `<p>${productNameVI} được chế tác thủ công từ bộ sưu tập cao cấp của Ray Paradis.</p>` 
        },
        displayPriceMin: basePrice,
        displayPriceMax: basePrice + 1000000,
        isActive: true,
        isFeatured: i <= 5,
        ...subRecords
      },
    });

    if (i % 10 === 0) console.log(`...Synced ${i}/50 products`);
  }
  console.log('✅ Catalog synchronized with 50 factory-generated products.');
}
