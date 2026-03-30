# Ray Paradis Documentation System

Welcome to the internal engineering documentation for **Ray Paradis**, a headless, distributed e-commerce engine designed for high concurrency, complex inventory operations, and sub-10ms authorization overhead.

## Navigation

* **System Design**
    * [Overview](./system/overview.md) - Product boundaries and technical summary
    * [Architecture](./system/architecture.md) - High-level system design and infrastructure
    * [Components](./system/components.md) - Domains, services, and responsibilities

* **Business Flows**
    * [Auth Flow](./flows/auth-flow.md) - Authentication, RBAC/ABAC authorization
    * [Checkout Flow](./flows/checkout-flow.md) - Cart compilation, inventory locks, and ordering
    * [Payment Flow](./flows/payment-flow.md) - Idempotent payment lifecycle (VNPay, PayPal)

* **API & Integrations**
    * [Endpoints](./api/endpoints.md) - Key REST APIs grouped by domain

* **Engineering Decisions**
    * [Architecture Decisions](./decisions/architecture-decisions.md) - Pragmatic Monolith and Dependency Injection
    * [Caching Strategy](./decisions/caching-strategy.md) - Active REDIS memory layer strategies
    * [Database Design](./decisions/database-design.md) - PostgreSQL schema overview and ORM choices

* **Setup & Operations**
    * [Local Development](./setup/local-development.md) - Docker, PM2, and startup procedures
    * [Environment Variables](./setup/environment.md) - `.env` configuration guide

* **Product Guide**
    * [Features](./product/features.md) - Highlighted user-facing capabilities
    * [User Journey](./product/user-journey.md) - Standard operational paths from browse to payment

* **Service Implementations**
    * [Backend API Core](../backend/README.md)
    * [Storefront UI](../storefront/README.md)
    * [Shared Ecosystem Contracts](../shared/README.md)
    * [Admin Portal](../back-office/README.md)
