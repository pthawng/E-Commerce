# Storefront Service (`@ray-paradis/storefront`)

## 1. Overview
The `@ray-paradis/storefront` service is the primary consumer-facing application for the luxury e-commerce platform. Built as a React SPA on Vite, it is designed strictly around the "Quiet Atelier" aesthetic, prioritizing 60fps micro-interactions, immediate responsiveness (via TanStack Query caching), and rendering complex multi-variant product configurations. It acts as the visual and interaction layer bounding the `backend` API.

## 2. Responsibilities
* **Owns:**
  * The entirety of the consumer User Interface and User Experience.
  * *Client State* management (e.g., active cart modals, multi-step checkout wizard progression) using Zustand.
  * In-browser caching and Background Syncing of *Server State* (e.g., live product pricing) using TanStack Query.
  * UI routing and the immediate visual handling of external Gateway redirects (VNPay/PayPal).
* **Does NOT Own:**
  * Financial truth or strict order summation (it always yields to backend calculations).
  * Direct interaction with PGSQL or Redis.
  * Private webhook validations or cryptographic signatures.

## 3. Key Modules / Features
Built upon a **Feature-Sliced** project structure grouping code by user domain:
* **`products`**: The Catalog. Heavily handles nested variant selections (Size + Material combinations) and renders HD visual assets. Optimization target for Largest Contentful Paint (LCP).
* **`cart`**: Local-first shopping bag. Aggregates selected variants and syncs anonymous or authenticated selections to the backend seamlessly.
* **`checkout`**: A specialized, highly-controlled UI wizard. Manages the sensitive handoff where users confirm intent, trigger backend atomic locks, and dispatch to VNPay/PayPal.
* **`auth` / `profile`**: Customer identity portals mapping to backend JWT sessions, displaying historical Orders and saved shipping entities.

## 4. Architecture Notes
* **Feature-Sliced Design**: Avoids the anti-pattern of mega `src/components` or `src/hooks` folders. Code belonging to Checkout (checkout hooks, checkout UI, checkout types) stays in `src/features/checkout`.
* **Decoupled Server vs Client State**: Zustand is strictly restricted to ephemeral local UI phenomena (e.g., `isCartDrawerOpen`). TanStack Query inherently manages all persistent domain states fetched from the backend, guaranteeing minimal prop-drilling and automatic cache invalidation.
* **Shared Types Syncing**: Structurally imports all DTOs and Payload specifications directly from the `@ray-paradis/shared` workspace, ensuring TS compiler failures if the backend API contract shifts.

## 5. External Dependencies
* **Backend API (`@ray-paradis/backend`)**: The sole source of truth via REST.
* **External Gateways**: VNPay and PayPal portals (redirect targets).
* **CDN Providers**: For fetching luxury 3D models or 4k ring media specified by backend payload pointers.

## 6. Key Flows (Service Perspective)
* **The Catalog Discovery Flow**:
  * User loads route -> `TanStack Query` checks its cache -> Cache Miss triggers an API GET -> React suspends/shows skeleton -> UI paints the `Product`. Subsequent visits immediately paint from memory while background-re-validating.
* **The Checkout Sequence**:
  * User submits Shipping Address (Local State) -> Dispatches `POST /order` -> Backend responds with *Gateway Redirect URL* & *Order ID* -> Storefront mutates `window.location.href`, abandoning the current local runtime to execute the financial handshake externally.
* **Payment Return**:
  * Gateway returns User to `storefront/checkout/vnpay/callback`. **Crucially**, the Storefront completely distrusts the URL parameters (which can be spoofed), and instead fires a polling request to `GET /payment/status/:orderId` to fetch the deterministic backend validation state before rendering a "Success" or "Failed" UI.

## 7. Environment & Configuration
Requires core `.env` pointing to the execution environments.

```bash
# Target REST API
VITE_API_BASE_URL=http://localhost:4000/api

# Standard app ports defined for Vite
VITE_PORT=5173 
```

## 8. How to Run
Trigger this service specifically via the workspace root:

```bash
npm run dev --workspace=@ray-paradis/storefront
```
*Note: Ensure the backend is concurrently running, or Storefront will fail all TanStack queries.*

## 9. Notes
* **Assumptions**: Presumes all structural payloads conform entirely to `@ray-paradis/shared`. Assumes browser environments support modern JS modules (ES Modules).
* **Limitations**: Current SPA (Single Page Application) nature limits native SEO purely to client-side renders. If heavy SEO on Catalog URLs becomes mandatory, this service may need to shift architectural paradigms toward Next.js (SSR).
* **Future Improvements**: Implementation of generic Request Response interceptor inside Axios to uniformly handle `401 Unauthorized` token-refreshing cycles without duplicating logic per feature slice.
