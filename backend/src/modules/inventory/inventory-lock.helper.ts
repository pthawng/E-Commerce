import { withRetry } from '@common/utils/retry.util';
import { Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface LockedInventoryBalance {
  id: string;
  quantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  inTransitQuantity: number;
}

/**
 * Locks one inventory balance row with NOWAIT semantics.
 * Keep this centralized so all stock mutations use the same parameterized query.
 */
export async function lockInventoryBalance(
  tx: Prisma.TransactionClient,
  params: {
    variantId: string;
    warehouseId: string;
    logger?: Logger;
    context?: string;
    notFoundMessage?: string;
  },
): Promise<LockedInventoryBalance> {
  const item = await withRetry(
    async () => {
      const [row] = await tx.$queryRaw<LockedInventoryBalance[]>`
        SELECT id, quantity, "reservedQuantity", "damagedQuantity", "inTransitQuantity"
        FROM "inventory_balances"
        WHERE "productVariantId" = ${params.variantId}::uuid
          AND "warehouseId" = ${params.warehouseId}::uuid
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
        `No inventory balance found for variant=${params.variantId} warehouse=${params.warehouseId}`,
    );
  }

  return item;
}
