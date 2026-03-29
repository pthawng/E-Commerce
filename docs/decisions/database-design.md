# Database Design

## 1. ORM Selection: Prisma
**Decision:** Utilize Prisma as the Primary ORM over TypeORM/Sequelize.

**Rationale:**
* Type safety is mathematically guaranteed by the Prisma schema map during TypeScript compilation.
* Introspection and migration tracking is deterministic.
* Native transaction batching prevents $N+1$ querying overhead typically plagued by active-record ORMs.

## 2. The Core Models Structure
The PostgreSQL schema reflects a heavily abstracted multi-dimensional entity space to support diverse luxury catalog items.

### Catalog Engine (`Product`, `Variant`, `Attribute`)
Unlike a basic store (A Shirt has Sizes), this catalog maps non-linear variants.
- `Attribute`: "Band Material"
- `AttributeValue`: "18k Rose Gold", "Platinum"
- `ProductVariant`: The actual physical SKU sold, mapping to combination matrices of `AttributeValue`. A single `Product` ("Solitaire Ring") may hold 20+ `ProductVariant` lines, each distinct.

### Inventory Engine (`InventoryItem`, `Warehouse`, `InventoryReservation`)
Inventory directly targets `ProductVariant`, NOT `Product`.
- `InventoryItem`: Tracks exact physical count per variant explicitly scoped to a `Warehouse`.
- `InventoryReservation`: An ephemeral record binding an immutable stock hold during checkout to prevent concurrent double-booking.
- `InventoryLog`: Append-only audit trail mapping *every* unit delta, essential for backend accounting discrepancy resolution.

### Transaction Engine (`Order`, `OrderItem`, `PaymentTransaction`)
- `Order` acts as the financial master parent.
- `OrderItem` explicitly duplicates historical data (price at time of purchase) to decouple the invoice from future `ProductVariant` price shifts.
- `PaymentTransaction` acts as the idempotent ledge containing raw Gateway references for refunds.

## 3. Foreign Key Philosophy
**Strict Relations:** No loose JSONB fields for relational mappings. We explicitly use foreign keys with Prisma's declarative referential actions (e.g., `Cascade` delete for a variant when the parent product is deleted) to enforce referential integrity absolutely.
