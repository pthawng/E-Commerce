-- Phase 6: Observability & Audit Platform
-- Additive migration only. Existing audit/outbox records remain valid.

ALTER TABLE "AuditLog"
  ADD COLUMN "actorType" TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN "resourceType" TEXT,
  ADD COLUMN "resourceId" TEXT,
  ADD COLUMN "reason" TEXT,
  ADD COLUMN "ipAddress" TEXT,
  ADD COLUMN "userAgent" TEXT,
  ADD COLUMN "correlationId" TEXT,
  ADD COLUMN "requestId" TEXT;

CREATE INDEX "idx_audit_correlation" ON "AuditLog"("correlationId");

ALTER TABLE "domain_event_outbox"
  ADD COLUMN "aggregateId" TEXT,
  ADD COLUMN "correlationId" TEXT,
  ADD COLUMN "failureReason" TEXT,
  ADD COLUMN "firstProcessedAt" TIMESTAMP(3),
  ADD COLUMN "lastProcessedAt" TIMESTAMP(3);

CREATE INDEX "domain_event_outbox_eventType_aggregateId_idx"
  ON "domain_event_outbox"("eventType", "aggregateId");
CREATE INDEX "domain_event_outbox_correlationId_idx"
  ON "domain_event_outbox"("correlationId");

CREATE TABLE "security_event_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "type" TEXT NOT NULL,
  "principalId" TEXT,
  "principalType" TEXT,
  "severity" TEXT NOT NULL DEFAULT 'medium',
  "metadata" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "correlationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "security_event_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "security_event_logs_type_createdAt_idx"
  ON "security_event_logs"("type", "createdAt");
CREATE INDEX "security_event_logs_principalId_createdAt_idx"
  ON "security_event_logs"("principalId", "createdAt");
CREATE INDEX "security_event_logs_correlationId_idx"
  ON "security_event_logs"("correlationId");

ALTER TABLE "BackOfficeAuditLog"
  ADD COLUMN "reason" TEXT,
  ADD COLUMN "correlationId" TEXT;

CREATE INDEX "BackOfficeAuditLog_correlationId_idx" ON "BackOfficeAuditLog"("correlationId");
