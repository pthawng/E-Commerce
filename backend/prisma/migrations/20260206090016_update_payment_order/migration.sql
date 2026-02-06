-- CreateEnum
CREATE TYPE "PaymentMethodEnum" AS ENUM ('COD', 'VNPAY', 'PAYPAL');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('active', 'confirmed', 'released', 'expired');

-- AlterEnum
ALTER TYPE "OrderStatusEnum" ADD VALUE 'pending_payment';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentDeadline" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" "PaymentMethodEnum",
ADD COLUMN     "reservationId" TEXT,
ADD COLUMN     "sessionId" VARCHAR(100);

-- CreateTable
CREATE TABLE "inventory_reservations" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_reservations_orderId_key" ON "inventory_reservations"("orderId");

-- CreateIndex
CREATE INDEX "idx_reservation_cleanup" ON "inventory_reservations"("expiresAt", "status");

-- CreateIndex
CREATE INDEX "idx_reservation_order" ON "inventory_reservations"("orderId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_sessionId_idx" ON "Order"("sessionId");

-- CreateIndex
CREATE INDEX "Order_status_paymentDeadline_idx" ON "Order"("status", "paymentDeadline");

-- CreateIndex
CREATE INDEX "Order_code_idx" ON "Order"("code");
