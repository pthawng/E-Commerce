# Components

## Backend Modules (`@ray-paradis/backend`)
Structurally isolated NestJS modules, each guarding a distinct domain of the platform:

* **Authentication (`auth`, `rbac`, `abac`, `user`)**: Handles JWT creation, user identity, and granular role/attribute-based access control.
* **Catalog (`product`, `category`, `attribute`)**: Defines the core merchandise models, complex variant relationships, and taxonomy linking.
* **Operations (`inventory`, `warehouse`)**: Handles tracking stock across locations, atomic stock reservations, and inventory logs.
* **Commerce (`cart`, `order`)**: The transactional spine. Compiles cart items, estimates shipping, enforces order timelines, and holds legal financial truth.
* **Payment (`payment`)**: Encapsulates external payment gateways (VNPay, PayPal) and manages internal ledger idempotency.
* **Support (`mail`, `storage`)**: Shared tooling modules invoked across domains for notifications and asset handling.

## Frontend Domains (`@ray-paradis/storefront`)
A Feature-Sliced architecture, separating code structurally by user-centric domains rather than arbitrary technical layers (e.g., `/hooks`, `/components`).

* **Auth (`features/auth`)**: Client-side session management and user portal access.
* **Catalog Browsing (`features/products`)**: The filtering, search, and detail viewing capabilities. Optimized for fast paint.
* **Cart Operations (`features/cart`)**: Local-first or sync-heavy shopping bag state.
* **Checkout & Payment (`features/checkout`)**: The specialized wizard UI containing state-machines for shipping, verification, and payment redirect lifecycles.

## Admin Portal (`@ray-paradis/admin`)
An administrative terminal.
* **Catalog Management**: Creation flows for dynamic attributes and heavily nested product variants.
* **Order Fulfillment**: Table grids and detail hubs displaying user orders and allowing state progression (e.g., Shipping, Delivered).
* **System Operations**: Administrative controls over the underlying TBAC/ABAC role associations.

## Shared (`@ray-paradis/shared`)
A cross-workspace NPM module containing global TypeScript types, Zod schemas, and data transfer objects (DTOs). Ensures API request matching perfectly aligns with frontend state definitions.
