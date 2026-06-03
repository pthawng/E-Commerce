-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('LEDGER_POSTING', 'INVENTORY_ADJUSTMENT', 'PRICE_OVERRIDE');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('DRAFT', 'PENDING', 'SHIPPED', 'RECEIVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventOutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('MATCHED', 'MISMATCH', 'UNVERIFIED', 'RECONCILED');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('SHELF', 'BIN', 'VAULT', 'QC_STATION', 'CONSULTATION_ROOM', 'TRANSIT');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'IN_TRANSIT', 'SOLD', 'DAMAGED', 'LOST', 'QC_HOLD', 'CONSULTATION');

-- CreateEnum
CREATE TYPE "PermissionEffect" AS ENUM ('ALLOW', 'DENY');

-- CreateEnum
CREATE TYPE "LuxurySegment" AS ENUM ('PROSPECT', 'ACTIVE', 'LOYAL', 'VIP', 'VVIP', 'VIC');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('DRAFT', 'POSTED', 'CANCELLED', 'VOIDED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'ACTION_REQUIRED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'MFA_SETUP_REQUIRED', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "StaffInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatusEnum_new" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'CONFIRMED', 'MATERIAL_RESERVED', 'IN_PRODUCTION', 'QC', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED', 'REFUNDED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatusEnum_new" USING ("status"::text::"OrderStatusEnum_new");
ALTER TABLE "OrderTimeline" ALTER COLUMN "fromStatus" TYPE "OrderStatusEnum_new" USING ("fromStatus"::text::"OrderStatusEnum_new");
ALTER TABLE "OrderTimeline" ALTER COLUMN "toStatus" TYPE "OrderStatusEnum_new" USING ("toStatus"::text::"OrderStatusEnum_new");
ALTER TYPE "OrderStatusEnum" RENAME TO "OrderStatusEnum_old";
ALTER TYPE "OrderStatusEnum_new" RENAME TO "OrderStatusEnum";
DROP TYPE "OrderStatusEnum_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PermissionModule" ADD VALUE 'LEDGER';
ALTER TYPE "PermissionModule" ADD VALUE 'CRM';

-- DropIndex
DROP INDEX "Payment_captureId_idx";

-- DropIndex
DROP INDEX "Payment_captureId_key";

-- DropIndex
DROP INDEX "Payment_providerTransactionId_idx";

-- DropIndex
DROP INDEX "Payment_providerTransactionId_key";

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "changes",
DROP COLUMN "ipAddress",
DROP COLUMN "userAgent",
ADD COLUMN     "after" JSONB,
ADD COLUMN     "before" JSONB,
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "damagedQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "inTransitQuantity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "InventoryTransfer" DROP COLUMN "status",
ADD COLUMN     "status" "TransferStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "displayCurrency" TEXT NOT NULL DEFAULT 'VND',
ADD COLUMN     "exchangeRate" DECIMAL(19,6) NOT NULL DEFAULT 1.0,
ADD COLUMN     "guestEmail" VARCHAR(255),
ADD COLUMN     "stateMetadata" JSONB,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "amount",
DROP COLUMN "amountUsd",
DROP COLUMN "captureId",
DROP COLUMN "currency",
DROP COLUMN "exchangeRate",
DROP COLUMN "provider",
DROP COLUMN "providerTransactionId",
DROP COLUMN "rawPayload";

-- AlterTable
ALTER TABLE "PaymentTransaction" ADD COLUMN     "amountUsd" DECIMAL(19,2),
ADD COLUMN     "captureId" TEXT,
ADD COLUMN     "exchangeRate" DECIMAL(19,6),
ADD COLUMN     "paymentId" UUID,
ADD COLUMN     "providerTransactionId" TEXT,
ADD COLUMN     "rawPayload" JSONB,
ADD COLUMN     "reconciliationStatus" "ReconciliationStatus" NOT NULL DEFAULT 'UNVERIFIED';

-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "deviceName" TEXT,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "fingerprint" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "parentJti" UUID,
ADD COLUMN     "revokedReason" TEXT,
ADD COLUMN     "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "userAgent" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
DROP COLUMN "revokedAt",
ADD COLUMN     "revokedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "nickName" TEXT,
ADD COLUMN     "segment" "LuxurySegment" DEFAULT 'PROSPECT';

-- AlterTable
ALTER TABLE "UserPermission" ADD COLUMN     "effect" "PermissionEffect" NOT NULL DEFAULT 'ALLOW',
ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "isInternal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "inventory_reservations" ADD COLUMN     "cartItemId" UUID;

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_rates" (
    "id" UUID NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'VND',
    "targetCurrency" TEXT NOT NULL,
    "rate" DECIMAL(19,6) NOT NULL,
    "source" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currency_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLocation" (
    "id" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "LocationType" NOT NULL DEFAULT 'SHELF',
    "parentId" UUID,

    CONSTRAINT "InventoryLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalItem" (
    "id" UUID NOT NULL,
    "productVariantId" UUID NOT NULL,
    "locationId" UUID,
    "serialNumber" TEXT,
    "rfidTag" TEXT,
    "status" "ItemStatus" NOT NULL DEFAULT 'AVAILABLE',
    "integrityHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderItemId" UUID,

    CONSTRAINT "PhysicalItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "paymentId" UUID,
    "amount" DECIMAL(19,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "externalTransactionId" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_event_outbox" (
    "id" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "EventOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "domain_event_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "status" "JournalStatus" NOT NULL DEFAULT 'DRAFT',
    "postedAt" TIMESTAMP(3),
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_webhooks" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "externalTxnId" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PROCESSING',
    "payloadHash" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "processed_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" UUID NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "resourceId" VARCHAR(100) NOT NULL,
    "requestorId" UUID NOT NULL,
    "approverId" UUID,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "approverComment" TEXT,
    "metadata" JSONB,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerTransaction" (
    "id" UUID NOT NULL,
    "journalId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "debit" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionAuditLog" (
    "id" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "beforeStatus" TEXT,
    "afterStatus" TEXT,
    "actorId" UUID,
    "actorType" TEXT NOT NULL DEFAULT 'system',
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPreference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "intensity" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLifeEvent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "remindDaysBefore" INTEGER NOT NULL DEFAULT 7,
    "metadata" JSONB,

    CONSTRAINT "UserLifeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'LOW',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "staffStatus" "StaffStatus" NOT NULL DEFAULT 'MFA_SETUP_REQUIRED',
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecretEncrypted" TEXT,
    "mfaRecoveryCodes" TEXT,
    "department" TEXT,
    "invitedBy" UUID,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffInvitation" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "StaffInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "StaffInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackOfficeSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "BackOfficeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackOfficeAuditLog" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "targetUserId" UUID,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackOfficeAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_key_idx" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "currency_rates_baseCurrency_targetCurrency_idx" ON "currency_rates"("baseCurrency", "targetCurrency");

-- CreateIndex
CREATE INDEX "currency_rates_fetchedAt_idx" ON "currency_rates"("fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLocation_code_key" ON "InventoryLocation"("code");

-- CreateIndex
CREATE INDEX "InventoryLocation_warehouseId_idx" ON "InventoryLocation"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalItem_serialNumber_key" ON "PhysicalItem"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalItem_rfidTag_key" ON "PhysicalItem"("rfidTag");

-- CreateIndex
CREATE INDEX "PhysicalItem_productVariantId_idx" ON "PhysicalItem"("productVariantId");

-- CreateIndex
CREATE INDEX "PhysicalItem_status_idx" ON "PhysicalItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_externalTransactionId_key" ON "Refund"("externalTransactionId");

-- CreateIndex
CREATE INDEX "Refund_orderId_idx" ON "Refund"("orderId");

-- CreateIndex
CREATE INDEX "Refund_externalTransactionId_idx" ON "Refund"("externalTransactionId");

-- CreateIndex
CREATE INDEX "domain_event_outbox_status_createdAt_idx" ON "domain_event_outbox"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_code_key" ON "LedgerAccount"("code");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_code_key" ON "JournalEntry"("code");

-- CreateIndex
CREATE INDEX "idx_webhooks_lookup" ON "processed_webhooks"("externalTxnId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "processed_webhooks_provider_externalTxnId_key" ON "processed_webhooks"("provider", "externalTxnId");

-- CreateIndex
CREATE INDEX "approval_requests_type_resourceId_idx" ON "approval_requests"("type", "resourceId");

-- CreateIndex
CREATE INDEX "approval_requests_status_idx" ON "approval_requests"("status");

-- CreateIndex
CREATE INDEX "LedgerTransaction_journalId_idx" ON "LedgerTransaction"("journalId");

-- CreateIndex
CREATE INDEX "LedgerTransaction_accountId_idx" ON "LedgerTransaction"("accountId");

-- CreateIndex
CREATE INDEX "ClientPreference_userId_idx" ON "ClientPreference"("userId");

-- CreateIndex
CREATE INDEX "UserLifeEvent_userId_eventDate_idx" ON "UserLifeEvent"("userId", "eventDate");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_userId_key" ON "StaffProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffInvitation_tokenHash_key" ON "StaffInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "BackOfficeSession_userId_idx" ON "BackOfficeSession"("userId");

-- CreateIndex
CREATE INDEX "BackOfficeAuditLog_actorUserId_idx" ON "BackOfficeAuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "BackOfficeAuditLog_targetUserId_idx" ON "BackOfficeAuditLog"("targetUserId");

-- CreateIndex
CREATE INDEX "BackOfficeAuditLog_createdAt_idx" ON "BackOfficeAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_captureId_key" ON "PaymentTransaction"("captureId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_providerTransactionId_key" ON "PaymentTransaction"("providerTransactionId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_paymentId_idx" ON "PaymentTransaction"("paymentId");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_parentJti_idx" ON "RefreshToken"("parentJti");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalItem" ADD CONSTRAINT "PhysicalItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalItem" ADD CONSTRAINT "PhysicalItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalItem" ADD CONSTRAINT "PhysicalItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requestorId_fkey" FOREIGN KEY ("requestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPreference" ADD CONSTRAINT "ClientPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLifeEvent" ADD CONSTRAINT "UserLifeEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackOfficeSession" ADD CONSTRAINT "BackOfficeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackOfficeAuditLog" ADD CONSTRAINT "BackOfficeAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackOfficeAuditLog" ADD CONSTRAINT "BackOfficeAuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
