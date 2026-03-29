# Architecture Decisions

This document records the "Why" behind fundamental technical choices.

## Pragmatic Monolith vs Microservices
**Decision:** We chose a Modular Monolith (Pragmatic Monolith) via NestJS over a fleet of Microservices.

**Rationale:**
* A startup/mid-stage project moves fastest when engineers can refactor across domain boundaries without orchestrating distributed transactions or defining network contracts (gRPC/RabbitMQ) for simple joins.
* However, by strictly enforcing NestJS Dependency Injection, we simulate microservice isolation. E.g., The `OrderService` cannot theoretically query the `UserRepository` directly—it must inject the `UserService`.
* **Trade-off:** If one module causes a CPU spike, the whole instance slows down. If memory scaling becomes necessary, we will eventually split this monolith into physical microservices—the current DI structure guarantees this split will take ~2 weeks instead of a painful ~6 month rewrite.

## Feature-Sliced React Frontend
**Decision:** Storefront uses a Feature-Sliced pattern structure over traditional technical slice structure (e.g. `src/hooks`, `src/utils`).

**Rationale:**
* Grouping by domain (`features/cart`, `features/checkout`) ensures 90% of a developer's time building a checkout feature is spent inside one folder tree.
* It stops the infamous generic "Utils dump" where `src/utils/index.ts` becomes a 5000-line bottleneck.

## Server State Caching Tooling (TanStack Query)
**Decision:** Client relies intrinsically on TanStack Query rather than dumping all REST data into a massive global Zustand store.

**Rationale:**
* Redux/Zustand pattern is brilliant for *Client State* (is modal open?). It is terrible for *Server State* (what is the current price of this ring?).
* By delegating Server State to TanStack Query, the UI automatically gains background data polling, optimistic updates, and cache invalidation mechanics without writing boilerplate.
