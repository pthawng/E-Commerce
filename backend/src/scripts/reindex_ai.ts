import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:4100';
const INTERNAL_TOKEN = requireEnv('INTERNAL_SERVICE_TOKEN');

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required to reindex AI products`);
  }
  return value;
}

async function main() {
  console.log('Starting AI re-indexing...');

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      media: true,
    },
  });

  console.log(`Found ${products.length} products. Syncing to Qdrant...`);

  let success = 0;
  let failed = 0;

  for (const product of products) {
    const name = (product.name as any)?.vi || (product.name as any)?.en || 'No Name';
    const description =
      (product.description as any)?.vi || (product.description as any)?.en || '';

    const categoryName = product.categories[0]?.category?.name;
    const category = categoryName
      ? (categoryName as any)?.vi || (categoryName as any)?.en
      : 'Uncategorized';

    const thumbnail =
      product.media.find((media) => media.isThumbnail)?.url || product.media[0]?.url || '';

    const payload = {
      id: product.id,
      name,
      description,
      category,
      slug: product.slug,
      imageUrl: thumbnail,
      price: Number(product.displayPriceMin || 0),
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      updatedAt: product.updatedAt.toISOString(),
      locale: 'vi',
    };

    try {
      const res = await fetch(`${AI_SERVICE_URL}/products/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_TOKEN,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok || res.status === 202) {
        success++;
        if (success % 10 === 0) {
          console.log(`Progress: ${success}/${products.length} synced...`);
        }
      } else {
        const err = await res.text();
        console.error(`Failed to sync ${product.slug}: ${res.status} - ${err}`);
        failed++;
      }
    } catch (e) {
      console.error(`Network error for ${product.slug}:`, e);
      failed++;
    }
  }

  console.log('\nAI re-indexing complete.');
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);

  if (success > 0) {
    console.log('Products are indexed in Qdrant and ready for AI search.');
  }
}

main()
  .catch((e) => {
    console.error('Fatal error during re-indexing:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
