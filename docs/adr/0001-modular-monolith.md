# ADR 0001: Modular Monolith Core

## Status
Accepted

## Decision
Ray Paradis keeps commerce workflows in one NestJS backend and isolates domains through modules, service boundaries, DTOs, guards, and Prisma transactions.

## Rationale
Order, payment, inventory, customer, RBAC, and ledger flows share strong consistency requirements. A modular monolith keeps local transactions and debugging simple while still leaving clear seams for future extraction.

## Consequences
Modules must avoid bypassing domain services for cross-domain writes. Future extraction should be driven by operational pressure, not by architecture aesthetics.
