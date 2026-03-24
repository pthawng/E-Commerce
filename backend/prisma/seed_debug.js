const { PrismaClient } = require('../src/generated/prisma/client');
const { MediaType } = require('../src/generated/prisma/enums');
const { PrismaPg } = require('@prisma/adapter-pg');
const { parse } = require('pg-connection-string');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const logFile = path.join(__dirname, 'seed_debug.log');
fs.writeFileSync(logFile, 'Seed debug log started\n');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`);
}

log('Loading .env');
dotenv.config({ path: path.join(__dirname, '../.env') });

const connStr = process.env.DATABASE_URL || '';
log(`DB URL: ${connStr}`);

function slugify(text) {
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
  { id: "1", name: "Celestial Aura Necklace", price: "$42,500", category: "Necklace", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800", isNew: true },
  { id: "2", name: "Midnight Bloom Ring", price: "$8,200", category: "Ring", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800" },
  { id: "3", name: "Aurora Drops Earrings", price: "$15,400", category: "Earrings", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800", isNew: true },
  { id: "4", name: "Empire Gold Bracelet", price: "$28,900", category: "Bracelet", image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=800" },
  { id: "5", name: "Solstice Diamond Studs", price: "$12,400", category: "Earrings", image: "https://images.unsplash.com/photo-1635767793021-97817c19f236?auto=format&fit=crop&q=80&w=800" },
  { id: "6", name: "Lumina Pearl Strand", price: "$18,500", category: "Necklace", image: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&q=80&w=800" },
  { id: "7", name: "Stellar Sapphire Ring", price: "$34,200", category: "Ring", image: "https://images.unsplash.com/photo-1603561591411-0e7d3f170fe3?auto=format&fit=crop&q=80&w=800" },
  { id: "8", name: "Ethereal Link Bracelet", price: "$9,800", category: "Bracelet", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800" },
];

async function main() {
  try {
    log('Initializing Adapter');
    const adapter = new PrismaPg({ connectionString: connStr });
    
    log('Initializing PrismaClient');
    const prisma = new PrismaClient({ adapter });

    log('Start seeding...');

    const categories = [...new Set(MOCK_PRODUCTS.map(p => p.category))];
    const categoryMap = new Map();

    for (const catName of categories) {
      log(`Processing category: ${catName}`);
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
      log(`Category ${catName} ID: ${category.id}`);
    }

    for (const mock of MOCK_PRODUCTS) {
      log(`Processing product: ${mock.name}`);
      const price = parseFloat(mock.price.replace(/[$,]/g, ''));
      const slug = slugify(mock.name);

      await prisma.product.upsert({
        where: { slug },
        update: {},
        create: {
          name: { vi: mock.name, en: mock.name },
          slug,
          description: { vi: `Mô tả cho ${mock.name}`, en: `Description for ${mock.name}` },
          displayPriceMin: price,
          displayPriceMax: price,
          hasVariants: true,
          isActive: true,
          isFeatured: mock.isNew || false,
          categories: {
            create: {
              categoryId: categoryMap.get(mock.category),
            },
          },
          variants: {
            create: {
              sku: `${slug.toUpperCase()}-${mock.id}`,
              price: price,
              isDefault: true,
              isActive: true,
              thumbnailUrl: mock.image,
            },
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
      log(`Created product: ${mock.name}`);
    }

    log('Seeding finished.');
    await prisma.$disconnect();
    log('Disconnected.');
  } catch (err) {
    log(`ERROR: ${err.message}`);
    log(err.stack);
    process.exit(1);
  }
}

main();
