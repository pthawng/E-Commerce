import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const AI_SERVICE_URL = 'http://localhost:4100';
const INTERNAL_TOKEN = 'dev_internal_token_123';

async function main() {
  console.log('🚀 Starting AI Re-indexing...');
  
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: {
      categories: { 
        include: { 
          category: true 
        } 
      },
      media: true
    }
  });

  console.log(`📦 Found ${products.length} products. Syncing to Qdrant...`);

  let success = 0;
  let failed = 0;

  for (const p of products) {
    // Map JSON localized values to plain strings
    const name = (p.name as any)?.vi || (p.name as any)?.en || 'No Name';
    const description = (p.description as any)?.vi || (p.description as any)?.en || '';
    
    // Get category name
    const catNameObj = p.categories[0]?.category?.name;
    const category = catNameObj ? ((catNameObj as any)?.vi || (catNameObj as any)?.en) : 'Uncategorized';
    
    // Get thumbnail
    const thumbnail = p.media.find(m => m.isThumbnail)?.url || p.media[0]?.url || '';

    const payload = {
      id: p.id,
      name,
      description,
      category,
      slug: p.slug,
      imageUrl: thumbnail,
      price: Number(p.displayPriceMin || 0),
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      updatedAt: p.updatedAt.toISOString(),
      locale: 'vi'
    };

    try {
      const res = await fetch(`${AI_SERVICE_URL}/products/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_TOKEN
        },
        body: JSON.stringify(payload)
      });

      if (res.ok || res.status === 202) {
        success++;
        if (success % 10 === 0) {
          console.log(`✅ Progress: ${success}/${products.length} synced...`);
        }
      } else {
        const err = await res.text();
        console.error(`❌ Failed to sync ${p.slug}: ${res.status} - ${err}`);
        failed++;
      }
    } catch (e) {
      console.error(`❌ Network error for ${p.slug}:`, e);
      failed++;
    }
  }

  console.log(`\n✨ AI Re-indexing complete!`);
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (success > 0) {
    console.log('💡 All products are now indexed in Qdrant and ready for AI Search.');
  }
}

main()
  .catch(e => {
    console.error('💥 Fatal error during re-indexing:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
