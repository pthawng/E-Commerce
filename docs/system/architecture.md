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

## 🛡️ Security Model & Threat Landscape
To maintain a high level of production readiness, the system addresses the following key threats with a layered defense strategy:

### 1. Threats Considered
- **XSS (Cross-Site Scripting)**: Minimized by using HttpOnly cookies for all sensitive tokens (AccessToken, RefreshToken). No sensitive data is stored in LocalStorage.
- **CSRF (Cross-Site Request Forgery)**: Mitigated via the **Double Submit Cookie Pattern**. The backend issues a `csrfToken` cookie, which the frontend must extract and send as an `x-csrf-token` header for all state-changing requests (POST/PATCH/DELETE).
- **Token Hijacking**: Hardened by **Session Binding** (User-Agent validation). If a token is stolen and used from a different User-Agent, the request is rejected.
- **Brute Force & DoS**: Controlled via **Global Rate Limiting** (`ThrottlerModule`) configured at the application level.

## 🛒 Cart Reconciliation Strategy
The system manages cart state across guest and authenticated lifecycles with a "Server-as-Truth" philosophy:

- **Guest Cart**: Stored in the database and linked via a `sessionId` (Cookie-based).
- **On Login**: The frontend triggers `POST /cart/merge`.
- **Conflict Resolution**:
  - If an item exists in both carts, quantities are summed and clamped against real-time stock.
  - The server validates all prices and availability during the merge.
  - The Guest Cart is purged after a successful merge.
- **Rule**: Client-side cart state is considered "disposable" and is strictly for optimistic UI; the server remains the authoritative source of truth.

## Component Interactions
- **Headless Clients → API**: The `storefront` and `back-office` query the `backend` REST API.
- **API → Service → Guard → Database**: Core transactions (Order finalizing, Inventory locking) are initiated by Controllers but MUST be orchestrated by Services to bypass the Invariant Guard and write to PostgreSQL.
- **Concurrency (NOWAIT)**: Inventory locking uses `SELECT FOR UPDATE NOWAIT` to fail fast and prevent deadlocks during high-traffic events.

## Infrastructure
... [Existing infrastructure details] ...

