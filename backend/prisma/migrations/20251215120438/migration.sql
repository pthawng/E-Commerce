/*
  Warnings:

  - The `filterType` column on the `Attribute` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AttributeInputType" AS ENUM ('text', 'textarea', 'select', 'multiselect', 'boolean', 'swatch_color', 'swatch_image');

-- AlterTable
ALTER TABLE "Attribute" DROP COLUMN "filterType",
ADD COLUMN     "filterType" "AttributeInputType" NOT NULL DEFAULT 'select';

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "thumbnailUrl" TEXT;
