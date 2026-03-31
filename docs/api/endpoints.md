# Endpoints

*Note: Grouped logically by domain context rather than strictly by technical controller naming.*

## 🔐 Auth & Identity Realm
- `POST /auth/login` : Negotiate JWT + Refresh sets.
- `POST /auth/register` : User creation tree.
- `GET /auth/me` : Profile data retrieval.
- `GET /auth/permissions` : Returns active privilege structures.
- `POST /auth/refresh` : Extends session.
- `POST /auth/reset-password/verify` : Recovery paths.

## 🛒 Storefront & Operations
- `GET /product` : Main catalog array (supports heavily nested variant relations).
- `GET /product/:id` | `GET /product/slug/:slug` : Deep entity resolution.
- `GET /product/variants/:variantId` : Specific variant pricing/media resolution.
- `GET /category` | `GET /category/:id` : Taxonomy and tree.
- `GET /attribute` | `GET /attribute/:id/values` : Resolve dynamic UI facets (e.g. Ring Size mappings).

## 🎫 Commerce (Cart & Checkout)
- `GET /cart` : Resync anonymous/local cart to live variants.
- `POST /cart` : Push variant mutations.
- `PATCH /cart/items/:variantId` : Granular quantity update for specific line items.
- `POST /cart/merge` : Sync guest cart into user profile after login.
- `POST /cart/refresh` : Trigger manual price re-validation.
- `POST /order` : (Storefront) Execute Checkout Flow / Reservation creation.
- `GET /order/:id` : Deep order summary + tracking string.
- `GET /admin/orders` : (Back-Office) Order grids management.

### Cart API Design Notes
The Cart API is intentionally granular to support:
- **Optimistic UI Updates**: Faster UX by only merging small delta changes.
- **Partial Item Updates**: Reducing payload size by only sending what changed.
- **Cart Merge Strategies**: Seamlessly merging Guest -> User data during the login lifecycle.
- **Price Revalidation**: Handling long-session price drift before checkout.

### Inventory Consistency Model
- **Validation step**: non-locking (fast, scalable). Performed at Step 1 of checkout to provide quick feedback.
- **Reservation step**: locking (strict consistency). Performs `FOR UPDATE NOWAIT` to lock rows before finalizing the order.
- **Trade-off**: Higher throughput for the initial step vs. occasional checkout failures under extreme concurrency.


## 💳 Payment Integrations
- `POST /payment/vnpay/create` : Generate gateway redirect URL.
- `GET /payment/vnpay/callback` : Storefront landing route (UI redirect only).
- `GET /payment/vnpay/ipn` : Public asynchronous webhook listener.
- `GET /payment/status/:orderId` : Dedicated polling endpoint for frontend post-payment UI updating.

## 📦 Fulfillment & Logistics (Internal)
- `GET /inventory/warehouses` : Multi-location tracking parameters.
- `GET /inventory/stock` | `GET /inventory/stock/:variantId` : Real-time unit metrics (Total, Reserved, Available).
- `POST /inventory/transfer` : Moving units inter-warehouse.

## 🛡️ Administrative (RBAC)
- `GET /rbac/roles` | `GET /rbac/permissions` : Tree management UI bindings.
- `POST /rbac/users/:userId/roles` : Map user powers manually.
