# System Architecture & Database Schema

The **Vault & Inventory** module uses PostgreSQL as its primary transactional database, ORM database mappings via Prisma, and NestJS for backend services. It is designed to handle high concurrency, audit compliance, and strict business invariants.

## Concurrency Control & Race Conditions

In high-value luxury jewelry, overselling (or double-booking a unique, serialized item) is unacceptable. The system utilizes **Pessimistic Locking** (`SELECT ... FOR UPDATE`) in raw database transactions when reserving or adjusting stock balances.

For example, checking and reserving a variant's inventory:
1. Open database transaction (`prisma.$transaction`).
2. Query row-level lock on the `InventoryBalance` matching `variantId` and `warehouseId`.
3. Verify that `quantity - reservedQuantity - damagedQuantity >= requested`.
4. If valid, increment `reservedQuantity` and commit. If invalid, roll back.

This prevents race conditions when multiple checkout sessions compete for the same stock simultaneously.

## Database Constraints (Check Constraints)

To prevent data corruption at the database level, custom check constraints must be added via raw SQL migrations since Prisma does not natively support them.

```sql
-- Enforces positive values and positive balances
ALTER TABLE "inventory_balances" ADD CONSTRAINT "chk_quantity_positive" CHECK ("quantity" >= 0);
ALTER TABLE "inventory_balances" ADD CONSTRAINT "chk_reserved_positive" CHECK ("reservedQuantity" >= 0);
ALTER TABLE "inventory_balances" ADD CONSTRAINT "chk_damaged_positive" CHECK ("damagedQuantity" >= 0);

-- Enforces that reservations do not exceed actual stock level
ALTER TABLE "inventory_balances" ADD CONSTRAINT "chk_reserved_le_quantity" CHECK ("reservedQuantity" <= "quantity");

-- Enforces that transfers cannot occur between the same warehouse
ALTER TABLE "stock_transfers" ADD CONSTRAINT "chk_different_warehouses" CHECK ("fromWarehouseId" <> "toWarehouseId");
```

## Logging Separation

We maintain two distinct log models to separate transactional modifications from operational administrative actions:

- **InventoryLog:** Logs changes in physical quantities (e.g. Sales, Imports, Adjustments). Directly references the `InventoryBalance` row.
- **InventoryAuditLog:** Tracks administrative user decisions (e.g. resolving a discrepancy, approving a stock transfer, changing a vault's insurance limit). Stores before/after snapshots for auditability.

---

## Prisma Models Representation

Below are the primary models in `prisma/schema.prisma` for this module:

```prisma
model Warehouse {
  id             String              @id @default(uuid()) @db.Uuid
  code           String              @unique @db.VarChar(50)
  name           String              @db.VarChar(100)
  type           WarehouseType       @default(SHOWROOM)
  insuranceLimit Decimal             @default(0) @db.Decimal(19, 2)
  
  balances       InventoryBalance[]
  physicalItems  PhysicalItem[]
}

model InventoryBalance {
  id               String         @id @default(uuid()) @db.Uuid
  productVariantId String         @db.Uuid
  warehouseId       String         @db.Uuid
  quantity         Int            @default(0) // On-hand
  reservedQuantity Int            @default(0)
  damagedQuantity  Int            @default(0)
  inTransitQuantity Int           @default(0)

  productVariant   ProductVariant @relation(fields: [productVariantId], references: [id], onDelete: Cascade)
  warehouse        Warehouse      @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  logs             InventoryLog[]

  @@unique([productVariantId, warehouseId])
}

model PhysicalItem {
  id               String             @id @default(uuid()) @db.Uuid
  productVariantId String             @db.Uuid
  warehouseId      String             @db.Uuid
  serialNumber     String             @unique @db.VarChar(100)
  rfidTag          String?            @unique @db.VarChar(100) // Optional for untagged items
  status           PhysicalItemStatus @default(IN_VAULT)
}

model InventoryReservation {
  id               String            @id @default(uuid()) @db.Uuid
  orderId          String            @db.Uuid
  productVariantId String            @db.Uuid
  warehouseId      String            @db.Uuid
  physicalItemId   String?           @db.Uuid
  quantity         Int               @default(1)
  status           ReservationStatus @default(ACTIVE)
  expiresAt        DateTime
  idempotencyKey   String?           @unique @db.VarChar(100)
}
```
