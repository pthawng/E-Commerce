/*
  Warnings:

  - You are about to drop the column `referenceCode` on the `InventoryLog` table. All the data in the column will be lost.
  - You are about to drop the column `stockAfter` on the `InventoryLog` table. All the data in the column will be lost.
  - Added the required column `afterQuantity` to the `InventoryLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `beforeQuantity` to the `InventoryLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `warehouseId` to the `inventory_reservations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ActionType" ADD VALUE 'DAMAGE';

-- AlterEnum
ALTER TYPE "PermissionModule" ADD VALUE 'INVENTORY';

-- DropIndex
DROP INDEX "inventory_reservations_orderId_key";

-- AlterTable
ALTER TABLE "InventoryLog" DROP COLUMN "referenceCode",
DROP COLUMN "stockAfter",
ADD COLUMN     "afterQuantity" INTEGER NOT NULL,
ADD COLUMN     "beforeQuantity" INTEGER NOT NULL,
ADD COLUMN     "referenceType" TEXT;

-- AlterTable
ALTER TABLE "inventory_reservations" ADD COLUMN     "warehouseId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "InventoryTransfer" (
    "id" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "fromWarehouseId" UUID NOT NULL,
    "toWarehouseId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "note" TEXT,
    "actorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransfer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
