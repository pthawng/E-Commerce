import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const AI_SERVICE_URL = 'http://localhost:4100/products/embed';

async function sync() {
  console.log('🚀 Starting AI Product Sync...');
  
  const products = await prisma.product.findMany({
    include: {
      categories: {
        include: {
          category: true
        }
      },
      media: {
        orderBy: { order: 'asc' },
        take: 1
      }
    }
  });

  console.log(`📦 Found ${products.length} products to sync.`);

  let successCount = 0;
  let errorCount = 0;

  // Helper to extract string from Json (assuming format like { en: "Name" } or just string)
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
        category: product.categories[0]?.category ? extractText(product.categories[0].category.name) : 'Uncategorized',
        price: product.displayPriceMin ? Number(product.displayPriceMin) : 0,
        isActive: product.isActive && product.deletedAt === null,
        slug: product.slug,
        imageUrl: thumbnail,
      };

      await axios.post(AI_SERVICE_URL, payload, {
        headers: {
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || 'dev_internal_token_123',
          'Content-Type': 'application/json'
        }
      });
      successCount++;
      console.log(`...Synced ${product.name} (${successCount}/10)`);
    } catch (error: any) {
      errorCount++;
      console.error(`❌ Failed to sync product ${product.id}: ${error?.response?.data?.message || error.message}`);
    }
    
    // Always delay 4 seconds to respect Gemini Free Tier 15 RPM limits
    await new Promise(r => setTimeout(r, 4000));
  }

  console.log('\n✨ Sync Completed!');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  
  await prisma.$disconnect();
}

sync().catch(console.error);
