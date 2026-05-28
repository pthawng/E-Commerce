import { Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { withRetry } from '@common/utils/retry.util';

export interface LockedInventoryItem {
  id: string;
  quantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  inTransitQuantity: number;
}

/**
 * Locks one inventory row with NOWAIT semantics.
 * Keep this centralized so all stock mutations use the same parameterized query.
 */
export async function lockInventoryItem(
  tx: Prisma.TransactionClient,
  params: {
    variantId: string;
    warehouseId: string;
    logger?: Logger;
    context?: string;
    notFoundMessage?: string;
  },
): Promise<LockedInventoryItem> {
  const item = await withRetry(
    async () => {
      const [row] = await tx.$queryRaw<LockedInventoryItem[]>`
        SELECT id, quantity, "reservedQuantity", "damagedQuantity", "inTransitQuantity"
        FROM "InventoryItem"
        WHERE "productVariantId" = ${params.variantId}
          AND "warehouseId" = ${params.warehouseId}
        FOR UPDATE NOWAIT
      `;

      return row;
    },
    {
      logger: params.logger,
      context: params.context ?? 'InventoryLock',
    },
  );

  if (!item) {
    throw new NotFoundException(
      params.notFoundMessage ??
        `No inventory found for variant=${params.variantId} warehouse=${params.warehouseId}`,
    );
  }

  return item;
}
