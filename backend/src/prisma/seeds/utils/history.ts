import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

export interface SeedScript {
  version: string;
  name: string;
  run: (prisma: PrismaClient) => Promise<void>;
}

export class SeedHistoryTracker {
  static async isApplied(prisma: PrismaClient, version: string): Promise<boolean> {
    const record = await prisma.dataSeedHistory.findUnique({
      where: { version },
    });
    return !!record;
  }

  static async markApplied(prisma: PrismaClient, seed: SeedScript): Promise<void> {
    await prisma.dataSeedHistory.create({
      data: {
        version: seed.version,
        name: seed.name,
        appliedAt: new Date(),
        // Checksum can be added if needed to detect changes in same version
      },
    });
  }

  /**
   * Simple checksum of the run function string (optional)
   */
  static calculateChecksum(fn: (...args: any[]) => any): string {
    return crypto.createHash('sha256').update(fn.toString()).digest('hex');
  }
}
