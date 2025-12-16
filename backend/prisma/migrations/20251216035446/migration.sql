/*
  Warnings:

  - The values [USER] on the enum `PermissionModule` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `slug` on the `Permission` table. All the data in the column will be lost.
  - The `action` column on the `Permission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[action]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PermissionModule_new" AS ENUM ('AUTH', 'PRODUCT', 'ORDER', 'DISCOUNT', 'CMS', 'SYSTEM');
ALTER TABLE "Permission" ALTER COLUMN "module" TYPE "PermissionModule_new" USING ("module"::text::"PermissionModule_new");
ALTER TYPE "PermissionModule" RENAME TO "PermissionModule_old";
ALTER TYPE "PermissionModule_new" RENAME TO "PermissionModule";
DROP TYPE "public"."PermissionModule_old";
COMMIT;

-- DropIndex
DROP INDEX "Permission_slug_key";

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "slug",
DROP COLUMN "action",
ADD COLUMN     "action" TEXT;

-- DropEnum
DROP TYPE "PermissionAction";

-- CreateIndex
CREATE UNIQUE INDEX "Permission_action_key" ON "Permission"("action");
