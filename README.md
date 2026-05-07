# Ray Paradis
*Headless e-commerce architecture engineered for scale and precision.*

## 🧠 Overview

> [!IMPORTANT]
> This repository contains a comprehensive internal documentation system. 
> 👉 **[Start here: Read the Global Architecture & Flows](./docs/README.md)** 
> Or view specific service implementation details: 
> [Backend API](./backend/README.md) | [Storefront](./storefront/README.md) | [Shared Contracts](./shared/README.md)

A distributed e-commerce engine built for complex multi-variant jewelry logic. It prioritizes atomic inventory control, heavy data caching, and sub-10ms authorization overhead over traditional monolithic implementations.

## ✨ Core Capabilities
* **Atomic Inventory Governance**: Immutable transaction locks prevent race conditions and overselling during hyper-concurrency checkouts.
* **Active Authorization Caching**: Enterprise RBAC/ABAC matrix cached via Redis memory to continuously bypass database I/O.
* **State-Machine Checkout**: Idempotent payment lifecycles integrated securely with VNPay and PayPal.
* **Headless Storefront**: Feature-Sliced React architecture prioritizing Core Web Vitals and 60fps micro-interactions.

## 🧩 Architecture
NPM Workspace Monorepo:
* **`@ray-paradis/backend`**: NestJS Core API & Job Queue Engine.
* **`@ray-paradis/storefront`**: Consumer-facing React UI.
* **`@ray-paradis/admin`**: Secured operations portal (Ant Design).
* **`@ray-paradis/shared`**: Universal DTOs and type schemas.

## 🛠 Stack
* **Engine**: NestJS, Node.js
* **Persistence**: PostgreSQL, Prisma ORM, Redis
* **Client**: React, Vite, TailwindCSS, Zustand, TanStack Query
* **Infrastructure**: Docker, Supabase

## ⚡ Quick Start
Copy `.env.example` to `.env` in all directories before booting.

```bash
git clone https://github.com/your-username/ray-paradis.git
cd ray-paradis

# Provision infrastructure
cd database && docker compose -f compose.dev.yaml up -d && cd ..

# Install dependencies (Workspaces)
npm install

# Migrate & Seed
cd backend && npx prisma migrate dev && npx prisma db seed && cd ..

# Boot
npm run dev --workspaces
```

## 🚀 Engineering Decisions
* **Event-Driven Domain Decoupling**: Order and Inventory domains are decoupled via the `DomainEventOutbox` pattern, trading inline DB transaction locks for eventual consistency and massive write scalability.
* **Distributed Concurrency Control**: Replaced Postgres row-level locks with a Redis-backed Distributed Lock (`DECRBY` atomic operations) to prevent DB connection pool exhaustion during flash sales.
* **Full-Stack Observability**: Integrated W3C Trace Context (`traceparent`) and `x-correlation-id` propagation from React Axios interceptors down to NestJS middlewares, enabling distributed tracing across the API Gateway and Service meshes.
* **Render-Waterfalls Mitigated**: Eliminated global React `<Suspense>` boundaries in favor of granular, route-level Suspense and hydration, protecting Largest Contentful Paint (LCP) and Time To Interactive (TTI).
* **Predictable Boundaries**: NestJS Dependency Injection mathematically enforces clean architecture, isolating domain logic for future horizontal scaling.
* **In-Memory Guard Rails**: Redis-backed 60s TTL cache aggressively shields PostgreSQL from sequential permission-check queries.

## 🧭 Interviewer's Guide
Key Code Paths:
1. **Domain Decoupling & Outbox**: `backend/src/modules/order/order.service.ts` (Event-driven inventory choreography).
2. **Flash Sale Synchronization**: `backend/src/modules/infra/distributed-lock.service.ts` (Atomic Redis reservation).
3. **Distributed Tracing**: `storefront/src/services/axiosClient.ts` & `backend/src/common/middlewares/correlation-id.middleware.ts`.
4. **Atomic Guarantees & Idempotency**: `backend/src/modules/payment/services/idempotency.service.ts` (Webhook retry governance).
5. **Frontend Architecture & Security**: `storefront/FRONTEND_SECURITY.md` (Zero-Trust enforcement).