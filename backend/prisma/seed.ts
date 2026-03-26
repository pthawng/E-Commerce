import { PrismaClient, MediaType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const connStr = process.env.DATABASE_URL || '';
const adapter = new PrismaPg({ connectionString: connStr });
const prisma = new PrismaClient({ adapter });

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

const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Celestial Aura Necklace",
    price: "$42,500",
    category: "Necklace",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800",
    isNew: true,
  },
  {
    id: "2",
    name: "Midnight Bloom Ring",
    price: "$8,200",
    category: "Ring",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800",
    isNew: true,
  },
  {
    id: "3",
    name: "Aurora Drops Earrings",
    price: "$15,400",
    category: "Earrings",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800",
    isNew: true,
  },
  {
    id: "4",
    name: "Empire Gold Bracelet",
    price: "$28,900",
    category: "Bracelet",
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=800",
    isNew: true,
  },
  {
    id: "5",
    name: "Solstice Diamond Studs",
    price: "$12,400",
    category: "Earrings",
    image: "https://images.unsplash.com/photo-1635767793021-97817c19f236?auto=format&fit=crop&q=80&w=800",
    isNew: true,
  },
  {
    id: "6",
    name: "Lumina Pearl Strand",
    price: "$18,500",
    category: "Necklace",
    image: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "7",
    name: "Stellar Sapphire Ring",
    price: "$34,200",
    category: "Ring",
    image: "https://images.unsplash.com/photo-1603561591411-0e7d3f170fe3?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "8",
    name: "Ethereal Link Bracelet",
    price: "$9,800",
    category: "Bracelet",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800",
  },
];

async function main() {
  console.log('Start seeding...');

  // 1. Create Global Attributes
  const materialAttr = await prisma.attribute.upsert({
    where: { code: 'material' },
    update: {},
    create: {
      code: 'material',
      name: { vi: 'Chất liệu', en: 'Material' },
      values: {
        create: [
          { value: { vi: 'Vàng 18k', en: '18k Gold' }, metaValue: '#D4AF37' },
          { value: { vi: 'Bạch kim', en: 'Platinum' }, metaValue: '#E5E4E2' },
        ]
      }
    },
    include: { values: true }
  });

  const lengthAttr = await prisma.attribute.upsert({
    where: { code: 'length' },
    update: {},
    create: {
      code: 'length',
      name: { vi: 'Chiều dài', en: 'Length' },
      values: {
        create: [
          { value: { vi: '16 inch', en: '16"' } },
          { value: { vi: '18 inch', en: '18"' } },
        ]
      }
    },
    include: { values: true }
  });

  // 2. Create Categories
  const categoryNames = [...new Set(MOCK_PRODUCTS.map(p => p.category))];
  const categoryMap = new Map();

  for (const catName of categoryNames) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(catName) },
      update: {},
      create: {
        name: { vi: catName, en: catName },
        slug: slugify(catName),
        isActive: true,
      },
    });
    categoryMap.set(catName, category.id);
  }

  // 3. Create Products
  for (const mock of MOCK_PRODUCTS) {
    const price = parseFloat(mock.price.replace(/[$,]/g, ''));
    const slug = slugify(mock.name);

    // Special handling for id: 1 (multiple variants)
    const variantsData = mock.id === "1" ? [
      { sku: 'CELESTIAL-GOLD-16', price: price, title: { en: '18k Gold / 16"', vi: 'Vàng 18k / 16"' }, isDefault: true, 
        attrs: [materialAttr.values[0].id, lengthAttr.values[0].id] },
      { sku: 'CELESTIAL-GOLD-18', price: price + 2000, title: { en: '18k Gold / 18"', vi: 'Vàng 18k / 18"' },
        attrs: [materialAttr.values[0].id, lengthAttr.values[1].id] },
      { sku: 'CELESTIAL-PLAT-16', price: price + 5000, title: { en: 'Platinum / 16"', vi: 'Bạch kim / 16"' },
        attrs: [materialAttr.values[1].id, lengthAttr.values[0].id] },
      { sku: 'CELESTIAL-PLAT-18', price: price + 7000, title: { en: 'Platinum / 18"', vi: 'Bạch kim / 18"' },
        attrs: [materialAttr.values[1].id, lengthAttr.values[1].id] },
    ] : [
      { sku: `${slug.toUpperCase()}-${mock.id}`, price: price, title: { en: 'Standard', vi: 'Chuẩn' }, isDefault: true, attrs: [] }
    ];

    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        variants: { deleteMany: {} },
        media: { deleteMany: {} },
        categories: { deleteMany: {} },
      },
      create: {
        name: { vi: mock.name, en: mock.name },
        slug,
        description: { 
          vi: `<p>${mock.name} là một kiệt tác của nghệ thuật chế tác trang sức, kết hợp giữa sự sang trọng cổ điển và tinh tế hiện đại.</p>`, 
          en: `<p>${mock.name} is a masterpiece of jewelry craftsmanship, blending classical luxury with modern sophistication.</p>` 
        },
        displayPriceMin: price,
        displayPriceMax: mock.id === "1" ? price + 7000 : price,
        hasVariants: true,
        isActive: true,
        isFeatured: mock.isNew || false,
        categories: {
          create: {
            categoryId: categoryMap.get(mock.category),
          },
        },
        variants: {
          create: variantsData.map(v => ({
            sku: v.sku,
            price: v.price,
            variantTitle: v.title,
            isDefault: v.isDefault || false,
            isActive: true,
            thumbnailUrl: mock.image,
            attributes: {
              create: v.attrs.map(attrValId => ({
                attributeValueId: attrValId
              }))
            }
          }))
        },
        media: {
          create: {
            url: mock.image,
            type: MediaType.image,
            isThumbnail: true,
            order: 0,
          },
        },
      },
    });

    console.log(`Synced product: ${mock.name}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
