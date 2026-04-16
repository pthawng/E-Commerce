/*
  Warnings:

  - You are about to drop the column `reservationId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `Cart` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CartItem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionCode]` on the table `PaymentTransaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentGatewayProvider" AS ENUM ('VNPAY', 'PAYPAL', 'VIETQR', 'COD');

-- CreateEnum
CREATE TYPE "PaymentProcessingStatus" AS ENUM ('INIT', 'PROCESSING', 'SUCCESS', 'FAILED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'BOUNCED', 'SPAM', 'REJECTED', 'FAILED');

-- AlterEnum
ALTER TYPE "PaymentMethodEnum" ADD VALUE 'VIETQR';

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_cartId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_productVariantId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "reservationId",
ADD COLUMN     "idempotencyKey" VARCHAR(100),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "VerifyEmailToken" ADD COLUMN     "ipAddress" VARCHAR(50),
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "inventory_reservations" ADD COLUMN     "sessionId" VARCHAR(100),
ADD COLUMN     "userId" UUID;

-- DropTable
DROP TABLE "Cart";

-- DropTable
DROP TABLE "CartItem";

-- CreateTable
CREATE TABLE "carts" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "sessionId" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "productVariantId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "cachedPrice" DECIMAL(19,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "discountSnapshot" JSONB,
    "taxRate" DECIMAL(5,2),
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "idempotencyKey" VARCHAR(255) NOT NULL,
    "responseBody" JSONB,
    "statusCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "provider" "PaymentGatewayProvider" NOT NULL,
    "providerTransactionId" TEXT NOT NULL,
    "captureId" TEXT,
    "amount" DECIMAL(19,2) NOT NULL,
    "amountUsd" DECIMAL(19,2),
    "exchangeRate" DECIMAL(19,2),
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" "PaymentProcessingStatus" NOT NULL DEFAULT 'INIT',
    "rawPayload" JSONB,
    "verifiedAt" TIMESTAMP(3),
    "errorLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_seed_history" (
    "id" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checksum" TEXT,

    CONSTRAINT "data_seed_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_outbox" (
    "id" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "templateVersion" TEXT NOT NULL DEFAULT 'v1',
    "context" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "providerMessageId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentOutboxId" UUID,

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "carts_userId_sessionId_key" ON "carts"("userId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cartId_productVariantId_key" ON "cart_items"("cartId", "productVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_idempotencyKey_key" ON "idempotency_records"("idempotencyKey");

-- CreateIndex
CREATE INDEX "idempotency_records_expiresAt_idx" ON "idempotency_records"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerTransactionId_key" ON "Payment"("providerTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_captureId_key" ON "Payment"("captureId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_providerTransactionId_idx" ON "Payment"("providerTransactionId");

-- CreateIndex
CREATE INDEX "Payment_captureId_idx" ON "Payment"("captureId");

-- CreateIndex
CREATE UNIQUE INDEX "data_seed_history_version_key" ON "data_seed_history"("version");

-- CreateIndex
CREATE UNIQUE INDEX "email_outbox_providerMessageId_key" ON "email_outbox"("providerMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "email_outbox_idempotencyKey_key" ON "email_outbox"("idempotencyKey");

-- CreateIndex
CREATE INDEX "email_outbox_status_scheduledAt_idx" ON "email_outbox"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Attribute_name_idx" ON "Attribute" USING GIN ("name");

-- CreateIndex
CREATE INDEX "AttributeValue_value_idx" ON "AttributeValue" USING GIN ("value");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_transactionCode_key" ON "PaymentTransaction"("transactionCode");

-- CreateIndex
CREATE INDEX "ProductVariant_variantTitle_idx" ON "ProductVariant" USING GIN ("variantTitle");

-- CreateIndex
CREATE INDEX "categories_name_idx" ON "categories" USING GIN ("name");

-- CreateIndex
CREATE INDEX "idx_reservation_owner" ON "inventory_reservations"("userId", "sessionId");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products" USING GIN ("name");

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_parentOutboxId_fkey" FOREIGN KEY ("parentOutboxId") REFERENCES "email_outbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;
