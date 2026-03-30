# Checkout Flow

The checkout process manages volatile cart states and high-stakes inventory atomic locks.

## 1. Cart Compilation
* **Syncing**: Anonymous or authenticated state is synced via `/cart`. All attributes and pricing are validated on the server to prevent tampering.

## 2. High-Concurrency Stock Reservation (Staff-level)
* **Initiation**: User clicks "Proceed to Checkout". The system must guarantee exactly that the stock exists.
* **NOWAIT Locking**: Backend executes `SELECT FOR UPDATE NOWAIT` on the specific product variant row. 
  * If the row is already locked by another process, the database fails-fast instead of queuing/hanging.
* **Exponential Backoff**: The internal `withRetry` utility handles lock contention by retrying up to 5 times with increasing delays.
* **State Machine Lifecycle**:
  * **ACTIVE**: A reservation record is created. Stock is "held" but not yet deducted.
  * **CONFIRMED**: Once payment is verified, the reservation is confirmed and the stock is permanently deducted.
  * **RELEASED**: If payment fails or time expires (TTL), the lock is released and stock remains available.

## 3. Order Finalization & Orchestration
* **Centralized Pipeline**: All checkouts MUST go through `OrderPaymentService` to bypass the Invariant Guard.
* **Idempotency (Zero-Trust)**: Uses a backend-issued JWT (`checkoutToken`). The unique `jti` (JWT ID) within the token acts as the definitive, spoof-proof idempotency key to prevent order duplication or replay attacks.
* **Status Shift**: Order moves from `PENDING_PAYMENT` to `CONFIRMED` only after Gateway Callback + Stock Confirmation.
