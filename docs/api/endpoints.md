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
- `POST /order` : (Storefront) Execute Checkout Flow / Reservation creation.
- `GET /order/:id` : Deep order summary + tracking string.
- `GET /admin/orders` : (Back-Office) Order grids management.

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
