# Architecture

## Architecture Style
Ray Paradis operates as a **Pragmatic Monolith (Modular Monolith)** supported by a headless frontend ecosystem. 

**Rationale:** Early isolation of features via microservices creates unnecessary DevOps overhead and network boundary latency. By using a modular monolithic pattern within NestJS, domain contexts (Inventory, Orders, Payment) remain strictly encapsulated through Dependency Injection (DI) and formal interfaces. This grants high delivery velocity now, while practically preparing the modules to be split horizontally across individual pods later if scaling dictates.

## Component Interactions
- **Headless Clients → API**: The `storefront` and `back-office` single-page applications query the `backend` REST API. Clients are strictly stateless.
- **API → Cache**: The `backend` intercepts incoming requests, routing authentication and permission matrix checks to Redis cache layers first.
- **API → Database**: Core transactions (Order finalizing, Inventory locking) bypass caching and negotiate directly via Prisma ORM to PostgreSQL for ACID compliance.
- **Webhooks → API**: Third-party providers (VNPay, PayPal) hit public webhook endpoints which utilize strict Idempotency Key validation before triggering state-machine shifts on internal Order records.

## Infrastructure
- **Compute Layer**: Node.js running NestJS handles incoming HTTP.
- **Primary Persistence (Database)**: **PostgreSQL**. Structured via Prisma for relational integrity across complex jewelry variants and dynamic taxonomy attributes.
- **Memory & Cache**: **Redis**. Provides immediate payload retrieval for high-read paths, authorization trees, and handles rate-limiting / idempotency locking.
- **Containers**: **Docker**. Local infrastructure (DBs, Redis) are orchestrated via Docker Compose for immediate developer onboarding.
- **Cloud/Edge Platform**: Designed to exist potentially inside Supabase/Vercel boundaries for managed scaling (subject to production environment).
