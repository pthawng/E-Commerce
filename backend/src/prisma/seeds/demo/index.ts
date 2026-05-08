import { PrismaClient } from '@prisma/client';
import { seedInventory } from './inventory';
import { seedCRM } from './crm';
import { seedAttributes } from './attributes';

export interface DemoSeedScript {
  name: string;
  run: (prisma: PrismaClient) => Promise<void>;
}

export const demoSeeds: DemoSeedScript[] = [
  {
    name: 'Semantic Attribute Registry',
    run: seedAttributes,
  },
  {
    name: 'Jewelry Catalog (100 Products Factory)',
    run: async (prisma) => {
      const { seedCatalog } = await import('./catalog');
      await seedCatalog(prisma);
    },
  },
  {
    name: 'Stock Allocation',
    run: seedInventory,
  },
  {
    name: 'Customer Relationship Management (1,000 Customers, 2,000 Orders Simulation)',
    run: seedCRM,
  },
];
