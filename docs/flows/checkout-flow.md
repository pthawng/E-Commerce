# Checkout Flow

The checkout process manages volatile cart states and high-stakes inventory atomic locks.

## 1. Cart Compilation
* **Local State**: Storefront user adds jewelry variants to Cart (`features/cart`). State is driven primarily client-side for "peppy" UI interactions.
* **Syncing**: Anonymous or authenticated state is synced with the DB via `POST/PATCH /cart`. Attributes, shipping metrics, and pricing formulas are continuously validated backend-side to prevent tampering.
* **Discounts Calculation**: Submits `PromoCode`s, triggering `Discount` relation checks for date-validity and availability.

## 2. Atomic Inventory Negotiation (Pre-Checkout)
* **Initiation**: User clicks "Proceed to Checkout". The system must guarantee stock exactly exists.
* **Lock Execution**: Backend initiates `InventoryReservation` creation. A transaction locks the exact `ProductVariant` across specific `Warehouse` entities.
* **Failure State**: If competing users lock variant X microseconds apart resulting in $n-1$ stock, later transactions fail cleanly, UI updates cart immediately.
* **TTL**: The reservation sits active (e.g., 15 minutes). If payment flow (Flow 3) isn't hit, scheduled CRON/Redis-Event clears lock automatically.

## 3. Order Finalization & State Machine Hand-off
* **Creation**: Shipping info and variant locks commit into a single final `Order` graph model (with `OrderItem` records).
* **Status Shift**: Order begins via the State-Machine in `PENDING_PAYMENT` state. An immutable `OrderTimeline` event is permanently recorded.
* **Redirect**: UI pushes user to external gateway generation.
