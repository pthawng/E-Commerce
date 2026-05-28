# ADR 0004: Payment Webhook Idempotency

## Status
Accepted

## Decision
Payment callbacks use provider transaction ids as the durable idempotency identity, backed by a database uniqueness constraint and a short-lived Redis execution lock.

## Rationale
Payment providers can send browser redirects, IPNs, retries, and delayed webhooks for the same transaction. The database record is the source of truth; Redis only reduces duplicate concurrent work.

## Consequences
Webhook processing must be safe to replay. Terminal payment/order transitions must be guarded by transaction-level locks or state-machine checks.
