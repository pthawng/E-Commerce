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
  const categoryData = await prisma.category.findMany();
  const categoryMap = new Map(categoryData.map(c => [c.slug, c.id]));

  const prefixes = ['Celestial', 'Midnight', 'Aurora', 'Eternal', 'Royal', 'Lumina', 'Gilded', 'Ethereal', 'Ancient', 'Infinite'];
  const nouns = ['Aura', 'Bloom', 'Drops', 'Empire', 'Solstice', 'Link', 'Tear', 'Glow', 'Crown', 'Crest'];
  const baseImages = [
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908',
  ];

  console.log('📦 Generating 50 Mock Products...');

  for (let i = 1; i <= 50; i++) {
    const prefix = prefixes[i % prefixes.length];
    const noun = nouns[(i * 3) % nouns.length];
    
    const categorySlugs = Array.from(categoryMap.keys());
    const categorySlug = categorySlugs[i % categorySlugs.length];
    
    const productNameEN = `${prefix} ${noun} ${categorySlug.slice(0, -1)}`;
    const productNameVI = `${noun} ${prefix} (Dòng ${categorySlug})`;
    const slug = slugify(`${productNameEN}-${i}`);
    const basePrice = Math.floor(Math.random() * 50000000) + 5000000;
    const imageUrl = `${baseImages[i % baseImages.length]}?auto=format&fit=crop&q=80&w=800`;

    // Root Entity First
    const product = await prisma.product.upsert({
      where: { slug },
      update: {}, // No updates for demo data if already exists
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
      }
    });

    // Relations handled separately (surgical updates)
    // 1. Categories
    await prisma.productCategory.upsert({
      where: { 
        productId_categoryId: { 
          productId: product.id, 
          categoryId: categoryMap.get(categorySlug)! 
        } 
      },
      update: {},
      create: {
        productId: product.id,
        categoryId: categoryMap.get(categorySlug)!
      }
    });

    // 2. Variants (Only if none exist)
    const existingVariants = await prisma.productVariant.findMany({ where: { productId: product.id } });
    if (existingVariants.length === 0) {
      await prisma.productVariant.createMany({
        data: [
          { 
            productId: product.id,
            sku: `${slug.toUpperCase()}-01`, 
            price: basePrice, 
            variantTitle: { en: 'Silver Edition', vi: 'Phiên bản Bạc' },
            isDefault: true,
            thumbnailUrl: imageUrl
          },
          { 
            productId: product.id,
            sku: `${slug.toUpperCase()}-02`, 
            price: basePrice + 1000000, 
            variantTitle: { en: 'Gold Edition', vi: 'Phiên bản Vàng' },
            thumbnailUrl: imageUrl
          },
        ]
      });
    }

    // 3. Media
    const existingMedia = await prisma.productMedia.findMany({ where: { productId: product.id } });
    if (existingMedia.length === 0) {
      await prisma.productMedia.create({
        data: {
          productId: product.id,
          url: imageUrl,
          type: MediaType.image,
          isThumbnail: true
        }
      });
    }

    if (i % 25 === 0) console.log(`...Synced ${i}/50 products`);
  }
}
