# System Overview

## Product Overview
**Ray Paradis** is a luxury, headless e-commerce engine operating specifically for complex multi-variant jewelry processing. Built not just to sell items, but to guarantee precise multi-location inventory allocation, atomic transaction safeguards, and an extremely responsive ("Quiet Atelier") shopping aesthetic.

## Target Users
1. **End-Consumers**: High-end jewelry shoppers who expect a flawless, rapid, and visually appealing ("Feature-Sliced React") browsing and purchasing experience.
2. **Operations & Admins**: Internal staff managing catalog iterations, inventory across various warehouses, and processing high-value order fulfillment workflows through a secured back-office interface.
3. **Developers/Engineers**: Our engineering team extending the platform, requiring clear data contracts, domain isolation, and horizontal scalability.

## Key Features
- **Atomic Inventory Governance**: Employs immutable transaction locks against PostgreSQL to prevent double-spending or overselling during high-demand checkouts (e.g., flash sales).
- **Sub-10ms Active Authorization**: Uses a continuous Redis memory sync layer to proxy RBAC/ABAC checking routines off the main relational database loop.
- **Idempotent State-Machine Payments**: Provides rigorous transactional webhook management connecting seamlessly to VNPay and PayPal, minimizing dirty data states or dropped payment updates.
- **Headless Storefront Experience**: A React + Vite SPA maximizing Core Web Vitals to deliver sub-second interactions via TanStack Query client-side caching.

## System Boundaries
- **Core API (Backend)**: Master truth for business logic. Directly owns database relationships, caching strategies, and background worker queues.
- **Storefront (Frontend)**: Responsible exclusively for presentation, UI state-machine routing, and rendering data from the backend. Contains no direct DB access.
- **Back Office (Frontend)**: The administrative boundary. Requires explicit, active RBAC/ABAC authorization per view/mutation.
- **External Integrations**: Payments (VNPay, PayPal, VietQR), Email dispatchers, CDN (for media).
