# Backend Service (`@ray-paradis/backend`)

## 1. Overview
The `@ray-paradis/backend` service operates as the core API, commerce engine, and master source of truth for the Ray Paradis platform. Built on NestJS, it serves as the primary boundary guarding business logic, executing transactional state shifts (orders/payments), and managing intricate role-based permissions for both the storefront and the back-office administrative portals. 

## 2. Responsibilities
* **Owns:**
  * Master relational database schemas and Prisma ORM migrations.
  * Fast-path active authorization (RBAC/ABAC matrices) cached in Redis.
  * Atomic inventory holding mechanisms to prevent hyper-concurrency overselling.
  * Ingress for third-party asynchronous webhooks (VNPay, PayPal).
  * Transactional Order state-machines (Draft, Pending, Paid, Shipped).
* **Does NOT Own:**
  * UI state management or rendering logic.
  * Raw static asset hosting (delegated to CDNs/Storage APIs).
  * Direct payment processing card loops (delegated entirely to VNPay/PayPal gateway redirects).

## 3. Key Modules / Features
Structured defensively by domain context:
* **`auth`, `rbac`, `abac`, `user`**: Identity layer. Hands out JWT tokens and dynamically resolves granular permission trees down to the specific resource.
* **`product`, `category`, `attribute`**: Catalog definitions. Resolves multidimensional SKU configurations (e.g., Size + Material + Gem Cut = 1 Unique Variant).
* **`inventory`, `warehouse`**: Operations boundary. Exclusively handles atomic variants locks (`InventoryReservation`) and ledger append-only logs (`InventoryLog`).
* **`cart`, `order`**: Commerce timeline. Turns localized cart payloads into firm financial order snapshots.
* **`payment`**: Idempotent ledger. Generates outgoing gateway URLs and captures incoming, asynchronous webhook fulfillments safely.

## 4. Architecture Notes
* **Modular Monolith**: Uses strict NestJS Dependency Injection. Domains (like `Order` and `Inventory`) do not directly execute SQL in each other's spaces; they interact exclusively via injected Service interfaces.
* **System Invariant Guard (Staff-level)**: Implemented a global **Prisma Extension Guard**. Mutations on sensitive models (`Order`, `Payment`, `InventoryItem`) are intercepted at the database level. If a mutation originates outside an authorized service layer (tracked via `SystemContextStore`), the system throws an `InvariantViolation` exception immediately.
* **Concurrency & Locking Model**:
  * Uses `FOR UPDATE NOWAIT` for row-level locking to prevent system-wide hangs and deadlocks.
  * Employs an **Exponential Backoff Retry (`withRetry`)** mechanism to handle lock contention gracefully during high-traffic SKU drops.
* **Controller/Service/Repository Pattern**: API routing is isolated from business rules, which are isolated from Prisma data-access logic.

## 5. External Dependencies
* **PostgreSQL (via Prisma)**: Primary persistence, ensuring ACID compliance for critical paths.
* **Redis (Recommended)**: High-speed caching, rate-limiting (`ThrottlerGuard`), and idempotency locking. **Production environment SHOULD use `REDIS_PASSWORD`**.
* **VNPay & PayPal (Gateways)**: Financial orchestrators driving the webhook engine.

## 6. Key Flows (Service Perspective)
*(For full system logic, see the [Global Checkout Flow](../docs/flows/checkout-flow.md))*

* **The Atomic Reservation (Order Checkout)**: 
  * Receives Cart intent -> `OrderPaymentService` initiates transaction -> `InventoryService` acquires `NOWAIT` row-lock -> Success yields a `PENDING_PAYMENT` Order. Contention triggers automated retries. Persistent failure returns 409/423.
* **Webhook Reconciliations**:
  * Gateway hits IPN/Callback -> **Idempotency Check** (Redis + DB Lock) -> `PaymentService` verifies amount and signature -> Mutates Payment record (Source of Truth) -> Atomic Inventory Deduction -> Order Confirmation.

## 7. Environment & Configuration
Requires core infrastructural wiring inside `.env`.
* `DATABASE_URL`: Full PostgreSQL connection string required by Prisma.
* `REDIS_HOST`, `REDIS_PORT`: Local or cloud memory cache dials.
* `REDIS_PASSWORD`: **(Required)** Strict requirement for production readiness.
* `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`: Cryptographic boundaries.
* Gateway Credentials: `VNPAY_TMNCODE`, `VNPAY_HASHSECRET`, `VNPAY_IPN_URL`.
* `CORS_ORIGIN`: Strict origin headers dictating acceptable SPA clients.

## 8. How to Run
... [Existing run instructions] ...

## 9. Notes & Staff Decisions
* **Guard Enforcement**: All mutation logic must live in `Service` classes. Ad-hoc repository calls or direct Prisma injections in Controllers will trigger Invariant Violations.
* **Idempotency**: All payment and inventory confirmation flows are idempotent by design, keyed by `TransactionId` or `OrderId`.
* **PII Protection**: User emails and sensitive identifiers are masked in public verification responses (e.g. password resets).
