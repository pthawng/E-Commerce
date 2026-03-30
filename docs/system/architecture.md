# Architecture

## Architecture Style
Ray Paradis operates as a **Pragmatic Monolith (Modular Monolith)** supported by a headless frontend ecosystem. 

**Rationale:** Early isolation of features via microservices creates unnecessary DevOps overhead. By using a modular monolithic pattern within NestJS, domain contexts remain strictly encapsulated through Dependency Injection (DI).

## System Hardening & Invariants (Staff-level)
To ensure long-term data integrity and prevent "bypass" bugs, the system implements a multi-layered defense:

### 1. Execution Context (`SystemContextStore`)
The backend uses **`AsyncLocalStorage`** to track the "Identity" of the code executing at any given moment. This allows the system to distinguish between a request coming from a Controller vs. an internal system process vs. a specific Service (e.g., `InventoryService`).

### 2. Prisma Invariant Guard
All database mutations are intercepted by a **Prisma Query Extension**. 
- **Sensitive Models**: `Order`, `Payment`, `InventoryItem`, `InventoryReservation`.
- **Enforcement**: If a mutation (create/update/delete) is attempted on a sensitive model without an authorized Service context, the extension throws a `BadRequestException` at the database level.
- **Goal**: This forces developers to use the designated Service Layer rather than injecting repositories directly into Controllers or other cross-domain modules.

## Component Interactions
- **Headless Clients → API**: The `storefront` and `back-office` query the `backend` REST API.
- **API → Service → Guard → Database**: Core transactions (Order finalizing, Inventory locking) are initiated by Controllers but MUST be orchestrated by Services to bypass the Invariant Guard and write to PostgreSQL.
- **Concurrency (NOWAIT)**: Inventory locking uses `SELECT FOR UPDATE NOWAIT` to fail fast and prevent deadlocks during high-traffic events.

## Infrastructure
... [Existing infrastructure details] ...
