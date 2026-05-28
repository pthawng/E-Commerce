# ADR 0002: Checkout Token Idempotency

## Status
Accepted

## Decision
The checkout token `jti` is the authoritative idempotency key for order creation. Client-provided idempotency headers or body fields are not used to identify a checkout commit.

## Rationale
The backend signs the checkout snapshot, cart hash, total amount, owner, and token id. Using the signed token id prevents a client from accidentally or intentionally changing the idempotency identity during retries.

## Consequences
Retrying the same checkout token must return the existing order. A new checkout validation step is required to create a different order.
