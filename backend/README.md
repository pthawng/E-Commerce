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
* **Modular Monolith**: Uses strict NestJS Dependency Injection. Domains (like `Order` and `Inventory`) do not directly execute SQL in each other's spaces; they interact exclusively via injected Service interfaces. This mimics microservices separation without the network delay penalty.
* **Controller/Service/Repository Pattern**: API routing is isolated from business rules, which are isolated from Prisma data-access logic.
* **Redis Guard Bypassing**: The `AuthGuard` skips PostgreSQL completely for 98% of queries, reading permission configurations directly from memory.

## 5. External Dependencies
* **PostgreSQL (via Prisma)**: Primary persistence, ensuring ACID compliance for critical paths like Order Creation.
* **Redis**: Ephemeral memory caching for high-speed rate-limiting, session control, and the centralized RBAC identity tree.
* **VNPay & PayPal (Gateways)**: Financial orchestrators driving the webhook engine.
* **Node Mailer / External SMTP**: Delegated dispatcher for transactional messaging.

## 6. Key Flows (Service Perspective)
* **The Atomic Reservation (Order Creation)**: 
  * Receives Cart intent -> Requests exclusive DB row-lock (`InventoryReservation`) for chosen variants -> Success yields a `PENDING_PAYMENT` Order. Failure instantly aborts flow, returning 409 Conflict.
* **Webhook Reconciliations**:
  * Gateway hits `POST /payment/vnpay/ipn` -> Checks IP/Signature against Secrets -> Checks Idempotency Key against `PaymentTransaction` table -> Mutates Order State -> Unlocks and destroys `InventoryReservation` -> Purges actual `InventoryItem` count.

## 7. Environment & Configuration
Requires core infrastructural wiring inside `.env`.
* `DATABASE_URL`: Full PostgreSQL connection string required by Prisma.
* `REDIS_HOST`, `REDIS_PORT`: Local or cloud memory cache dials.
* `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`: Cryptographic boundaries.
* Gateway Credentials: `VNPAY_TMNCODE`, `VNPAY_HASHSECRET`, `VNPAY_IPN_URL`.
* `CORS_ORIGIN`: Strict origin headers dictating acceptable SPA clients.

## 8. How to Run
Trigger this service specifically via the workspace root:

```bash
# Sync database schema before boot
npm run prisma:dev --workspace=@ray-paradis/backend

# Launch service locally with hot-reloading
npm run dev --workspace=@ray-paradis/backend
```

*Note: Default execution port is `:4000`.*

## 9. Notes
* **Assumptions**: Presumes all clients (Storefront/Admin) comply mechanically with REST/JSON standardizations and handle frontend rate-limiting gracefully.
* **Limitations**: Current monolithic structure shares compute resources. A massive catalog-sync operation could theoretically induce latency across cart checkout routes sharing the node process.
* **Future Improvements**: Transition the `payment` and `mail` notification handlers into a Redis-backed queue worker loop (BullMQ) to totally detach webhook ingestion latency from the main event thread.
