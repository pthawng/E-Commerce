# Caching Strategy

Performance hinges on intelligent data invalidation and proxy caching.

## 1. The Active Redis Matrix (Authorization layer)
**Decision:** Move all Authorization (RBAC/ABAC) permission resolving entirely off PostgreSQL read-replicas into Redis.

**Rationale:**
* In a micro-granular authorization environment, checking if a user `CanUpdateProductVariant[UUID::123]` requires traversing 4+ relational tables (User, Role, UserRole, Permission, RolePermission).
* To prevent this tax on every single API hit, the identity tree is compiled *once* at Login and pushed to Redis.
* Validating powers drops from 50ms (PgSQL Join) to 0.5ms (Redis Key Get).
* **Trade-off:** Invalidation complexity. If an Admin globally changes the `Manager` permission tree, the App must emit a Redis pattern purge (`DEL session:powers:*`) forcing all logged-in managers to re-cache on their next HTTP request.

## 2. Stateless Core Web Vitals (Edge caching)
**Decision:** Aggressively cache non-authenticated storefront responses.

**Rationale:**
* 92% of E-Commerce traffic sits strictly on Catalog and Variant fetching. These routes are identical for every anonymous viewer.
* Static/dynamic hybrid rendering via CDN limits requests physically reaching the NestJS engine.
* Only Cart and Checkout operations explicitly bypass caching layers to guarantee financial safety.

## 3. Ephemeral Inventory Locks
**Decision:** Use atomic transactions instead of Redis for direct stock holds.

**Rationale:**
* Redis is exceptional for cache, but less suitable as the financial source-of-truth.
* Inventory locks (`InventoryReservation` records) go straight to PostgreSQL to utilize true ACID characteristics and explicitly prevent double-selling of unique pieces under extreme load.
