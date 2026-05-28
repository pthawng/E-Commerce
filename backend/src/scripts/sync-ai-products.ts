import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL
  ? `${process.env.AI_SERVICE_URL.replace(/\/$/, '')}/products/embed`
  : 'http://localhost:4100/products/embed';
const INTERNAL_TOKEN = requireEnv('INTERNAL_SERVICE_TOKEN');

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required to sync AI products`);
  }
  return value;
}

async function sync() {
  console.log('Starting AI product sync...');

  const products = await prisma.product.findMany({
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      media: {
        orderBy: { order: 'asc' },
        take: 1,
      },
    },
  });

  console.log(`Found ${products.length} products to sync.`);

  let successCount = 0;
  let errorCount = 0;

  const extractText = (val: any) => {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object') return val.en || val.vi || Object.values(val)[0] || '';
    return '';
  };

  for (const product of products) {
    try {
      const thumbnail = product.media?.[0]?.url || '';
      const payload = {
        id: product.id,
        name: extractText(product.name),
        description: extractText(product.description),
        category: product.categories[0]?.category
          ? extractText(product.categories[0].category.name)
          : 'Uncategorized',
        price: product.displayPriceMin ? Number(product.displayPriceMin) : 0,
        isActive: product.isActive && product.deletedAt === null,
        slug: product.slug,
        imageUrl: thumbnail,
      };

      await axios.post(AI_SERVICE_URL, payload, {
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
          'Content-Type': 'application/json',
        },
      });
      successCount++;
      console.log(`Synced ${product.id} (${successCount}/${products.length})`);
    } catch (error: any) {
      errorCount++;
      console.error(
        `Failed to sync product ${product.id}: ${error?.response?.data?.message || error.message}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 4000));
  }

  console.log('\nSync completed.');
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${errorCount}`);

  await prisma.$disconnect();
}

sync().catch(console.error);
