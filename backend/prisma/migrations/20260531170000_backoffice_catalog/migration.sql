-- Back-office catalog production model.
-- Existing products/product_variants remain the source of truth for ProductDesign/SKU.

CREATE TYPE "ProductCatalogStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'OUT_OF_STOCK', 'PRE_ORDER', 'WORKSHOP_REVIEW', 'ARCHIVED');
CREATE TYPE "StockStatus" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'PRE_ORDER');
CREATE TYPE "CertificateType" AS ENUM ('PRODUCT', 'GEMSTONE', 'WARRANTY');
CREATE TYPE "PublishingWorkflowStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'LIVE', 'REJECTED');
CREATE TYPE "PublishingStepType" AS ENUM ('DRAFT', 'MEDIA_CONTENT_REVIEW', 'PRICING_REVIEW', 'BOUTIQUE_DISTRIBUTION', 'ONLINE');
CREATE TYPE "WorkflowStepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');
CREATE TYPE "ImportJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

ALTER TYPE "PermissionModule" ADD VALUE IF NOT EXISTS 'CATALOG';

CREATE TABLE "collections" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "products"
  ADD COLUMN "collectionId" UUID,
  ADD COLUMN "primaryCategoryId" UUID,
  ADD COLUMN "catalogStatus" "ProductCatalogStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "preorderEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "pricingApproved" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE TABLE "product_certificates" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "variantId" UUID,
    "certificateNo" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "type" "CertificateType" NOT NULL DEFAULT 'PRODUCT',
    "gemstone" TEXT,
    "fileUrl" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_certificates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pricing_formulas" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "materialCost" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "laborCost" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "marginMultiplier" DECIMAL(10,2) NOT NULL DEFAULT 4.2,
    "boutiqueCoefficient" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pricing_formulas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_pricing" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "materialCost" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "laborCost" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "marginMultiplier" DECIMAL(10,2) NOT NULL DEFAULT 4.2,
    "boutiqueCoefficient" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "retailPrice" DECIMAL(19,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "overrideReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" UUID,
    "formulaVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_pricing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_inventory" (
    "id" UUID NOT NULL,
    "productVariantId" UUID NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reservedStock" INTEGER NOT NULL DEFAULT 0,
    "preorderLimit" INTEGER,
    "stockStatus" "StockStatus" NOT NULL DEFAULT 'IN_STOCK',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_inventory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "publishing_workflows" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "status" "PublishingWorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" "PublishingStepType" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "publishing_workflows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "publishing_workflow_steps" (
    "id" UUID NOT NULL,
    "workflowId" UUID NOT NULL,
    "step" "PublishingStepType" NOT NULL,
    "status" "WorkflowStepStatus" NOT NULL DEFAULT 'PENDING',
    "assignedRole" TEXT,
    "completedAt" TIMESTAMP(3),
    "note" TEXT,
    CONSTRAINT "publishing_workflow_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_audit_logs" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "errorReport" JSONB,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "import_job_items" (
    "id" UUID NOT NULL,
    "importJobId" UUID NOT NULL,
    "productId" UUID,
    "rowNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errors" JSONB,
    CONSTRAINT "import_job_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "collections_slug_key" ON "collections"("slug");
CREATE INDEX "collections_slug_idx" ON "collections"("slug");
CREATE INDEX "collections_isActive_idx" ON "collections"("isActive");
CREATE INDEX "idx_products_collection" ON "products"("collectionId");
CREATE INDEX "idx_products_primary_category" ON "products"("primaryCategoryId");
CREATE INDEX "idx_products_catalog_status" ON "products"("catalogStatus");
CREATE INDEX "idx_products_created_at" ON "products"("createdAt");
CREATE INDEX "product_certificates_productId_idx" ON "product_certificates"("productId");
CREATE INDEX "product_certificates_variantId_idx" ON "product_certificates"("variantId");
CREATE INDEX "product_certificates_certificateNo_idx" ON "product_certificates"("certificateNo");
CREATE UNIQUE INDEX "product_pricing_productId_key" ON "product_pricing"("productId");
CREATE INDEX "product_pricing_retailPrice_idx" ON "product_pricing"("retailPrice");
CREATE UNIQUE INDEX "product_inventory_productVariantId_key" ON "product_inventory"("productVariantId");
CREATE INDEX "product_inventory_stockStatus_idx" ON "product_inventory"("stockStatus");
CREATE UNIQUE INDEX "publishing_workflows_productId_key" ON "publishing_workflows"("productId");
CREATE INDEX "publishing_workflows_status_idx" ON "publishing_workflows"("status");
CREATE UNIQUE INDEX "publishing_workflow_steps_workflowId_step_key" ON "publishing_workflow_steps"("workflowId", "step");
CREATE INDEX "publishing_workflow_steps_workflowId_idx" ON "publishing_workflow_steps"("workflowId");
CREATE INDEX "product_audit_logs_productId_createdAt_idx" ON "product_audit_logs"("productId", "createdAt");
CREATE INDEX "product_audit_logs_actorId_idx" ON "product_audit_logs"("actorId");
CREATE INDEX "import_jobs_status_createdAt_idx" ON "import_jobs"("status", "createdAt");
CREATE INDEX "import_job_items_importJobId_idx" ON "import_job_items"("importJobId");
CREATE INDEX "import_job_items_productId_idx" ON "import_job_items"("productId");
CREATE INDEX "pricing_formulas_isActive_version_idx" ON "pricing_formulas"("isActive", "version");

ALTER TABLE "products" ADD CONSTRAINT "products_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_primaryCategoryId_fkey" FOREIGN KEY ("primaryCategoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_certificates" ADD CONSTRAINT "product_certificates_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_certificates" ADD CONSTRAINT "product_certificates_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_pricing" ADD CONSTRAINT "product_pricing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_inventory" ADD CONSTRAINT "product_inventory_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "publishing_workflows" ADD CONSTRAINT "publishing_workflows_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "publishing_workflow_steps" ADD CONSTRAINT "publishing_workflow_steps_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "publishing_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_audit_logs" ADD CONSTRAINT "product_audit_logs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_audit_logs" ADD CONSTRAINT "product_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "import_job_items" ADD CONSTRAINT "import_job_items_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "import_job_items" ADD CONSTRAINT "import_job_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
