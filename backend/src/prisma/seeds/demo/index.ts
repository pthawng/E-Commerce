import { PrismaClient } from '@prisma/client';
import { seedInventory } from './inventory';
import { seedCRM } from './crm';

export interface DemoSeedScript {
  name: string;
  run: (prisma: PrismaClient) => Promise<void>;
}

export const demoSeeds: DemoSeedScript[] = [
  {
    name: 'Jewelry Catalog (100 Products Factory)',
    run: async (prisma) => {
      // Import dynamically to avoid loading dev dependencies or large mocks in prod if possible
      const { seedCatalog } = await import('./catalog');
      await seedCatalog(prisma);
    },
  },
  {
    name: 'Customer Relationship Management (100 Customers, 500 Orders)',
    run: seedCRM,
  },
  {
    name: 'Stock Allocation',
    run: seedInventory,
  },
];
