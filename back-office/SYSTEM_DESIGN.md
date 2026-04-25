# Ray Paradis Back-Office: System Design Specification

## 1. Executive Summary
The Ray Paradis Back-Office is a high-integrity, luxury-grade management system designed to support the operational excellence of a high-end jewelry brand. It leverages **Feature-Sliced Design (FSD)** for modularity and **Ant Design** for a robust, enterprise-grade UI, customized to reflect the "Quiet Atelier" aesthetic of the storefront.

---

## 2. Architecture: Feature-Sliced Design (FSD)
To ensure long-term maintainability and staff-level scalability, the project follows the FSD methodology:

| Layer | Responsibility | Example |
| :--- | :--- | :--- |
| **App** | Initialization, providers, global styles | `App.tsx`, `providers/` |
| **Processes** | Multi-page orchestrations | `ImportProducts`, `BulkOrderFulfillment` |
| **Pages** | Router-level compositions | `ProductListPage`, `OrderDetailsPage` |
| **Widgets** | Standalone UI blocks combining entities/features | `OrderStatistics`, `ProductEditor` |
| **Features** | User interactions with business logic | `UpdateOrderStatus`, `DeleteProduct` |
| **Entities** | Business domain models and logic | `OrderCard`, `useProductList` |
| **Shared** | Reusable UI primitives and utilities | `Button`, `Table`, `axiosInstance` |

---

## 3. Tech Stack (Tech Radar)
*   **Core**: React 18 (Vite) + TypeScript 5.x.
*   **UI Framework**: Ant Design (v5) with a custom **luxury-minimalist theme**.
*   **State Management**:
    *   **Server State**: TanStack Query (React Query) v5 for deterministic caching.
    *   **Client State**: Zustand for lightweight UI state (sidebar, theme).
    *   **Form State**: React Hook Form + Zod for schema-first validation.
*   **API Layer**: Axios with interceptors for RBAC and CSRF protection.
*   **Visualization**: Recharts for high-fidelity sales and inventory analytics.

---

## 4. Domain Models & Schema Highlights

### 4.1. Product & Catalog
*   **Polymorphic Variants**: Jewelry items require complex configurations (Material: Gold/Silver, Stone: Diamond/Ruby, Size: 1-10). The system uses a JSONB variant mapping to avoid table bloat.
*   **Media Gallery**: Support for 4K images, 360-degree videos, and 3D (GLB) assets.

### 4.2. Inventory (Material Ledger)
*   **Precision Tracking**: Materials (e.g., carats of diamonds) are tracked with 4-decimal precision.
*   **Audit Logging**: Every stock movement is logged with a user ID and timestamp for FAANG-level accountability.

### 4.3. Orders (State Machine)
*   **States**: `Pending` -> `Confirmed` -> `In-Production` -> `Quality-Control` -> `Shipped` -> `Delivered`.
*   **Financial Handshake**: Integration status with VNPay/PayPal is tracked within the order entity.

---

## 5. UI/UX Principles: "The Digital Atelier"
*   **Minimalism**: High whitespace, serif typography for headings (e.g., Playfair Display), and subtle transitions.
*   **Micro-interactions**: 60fps animations for state transitions (using Framer Motion where appropriate).
*   **Contextual Efficiency**: Inline editing and mass actions for heavy-duty inventory work.

---

## 6. Enterprise Security & Performance
*   **RBAC (Role-Based Access Control)**: Strictly enforced via `usePermission` hooks and route guards.
*   **Optimistic UI**: Use TanStack Query mutations to update the UI immediately, rolling back only on failure.
*   **Code Splitting**: 100% lazy loading of pages to keep the initial TTI (Time to Interactive) low.

---

## 7. Implementation Roadmap
1.  **Phase 1**: Scaffolding Layer Structure & Design System Tokens.
2.  **Phase 2**: Core Entities (User, Product, Order).
3.  **Phase 3**: Critical Features (Inventory Management, Order Fulfillment).
4.  **Phase 4**: Advanced Analytics & Auditing.
