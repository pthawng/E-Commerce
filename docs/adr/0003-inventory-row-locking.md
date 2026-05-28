# ADR 0003: Inventory Row Locking

## Status
Accepted

## Decision
Stock mutation paths lock the target `InventoryItem` row with PostgreSQL `FOR UPDATE NOWAIT` through one parameterized helper.

## Rationale
Checkout and stock movement can hit the same SKU concurrently. Row locks keep the inventory invariant in the database, and `NOWAIT` avoids request threads waiting indefinitely under contention.

## Consequences
Callers must handle retryable lock conflicts. New inventory mutation code should use the shared lock helper rather than raw SQL snippets.
