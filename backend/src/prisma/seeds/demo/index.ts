import { PrismaClient } from '@prisma/client';
import { seedInventory } from './inventory';

export interface DemoSeedScript {
  name: string;
  run: (prisma: PrismaClient) => Promise<void>;
}

export const demoSeeds: DemoSeedScript[] = [
  {
    name: 'Jewelry Catalog (50 Products Factory)',
    run: async (prisma) => {
      // Import dynamically to avoid loading dev dependencies or large mocks in prod if possible
      const { seedCatalog } = await import('./catalog');
      await seedCatalog(prisma);
    },
  },
  {
    name: 'Stock Allocation',
    run: seedInventory,
  },
];
