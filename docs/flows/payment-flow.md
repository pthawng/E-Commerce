# Payment Flow

The Idempotent Payment Integration connects internal State-Machines with asynchronous Gateway Webhooks.

## 1. Gateway Generation
* **Trigger**: Order hits `PENDING_PAYMENT` in Checkout Flow.
* **Delegation**: User initiates VNPay or PayPal sequence. Server generates secured, timed payment URL encapsulating total and specific internal `Order.id`.
* **Redirection**: Storefront jumps window location entirely to providers.

## 2. Asynchronous Fulfillment (The Webhook)
* **Ingestion**: Gateway pings `WEBHOOK /payment/vnpay/ipn`.
* **Idempotency Check**: The service queries `PaymentTransaction` using the gateway's unique transaction ID string. If it exists as "processed", the hook drops immediately, guaranteeing safety against webhook storms.
* **Signature Verification**: Hashes headers/payload mathematically matching Gateway Secret Keys to guarantee authenticity. Drops counterfeit traffic.
* **Action Routing**: Valid payloads commit the transaction state and immediately locate the parent `Order`.

## 3. Post-Payment Reconciliation
* **Success Transition**: Order transitions from `PENDING_PAYMENT` to `PAID` or `PROCESSING_FULFILLMENT`.
* **Failure Transition**: Negative IPN changes Order State back to editable Cart, unlocking Inventory immediately to pool.
* **User Callback**: User UI eventually lands on `GET /payment/vnpay/callback`. However, frontend purely waits/polls backend API for *Internal State*, ignoring Gateway URL parameters (as they are insecure UX hints, not immutable truth).
