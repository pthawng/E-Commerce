# Auth Flow

This document details the lifecycle of User Authentication and Authorization through Token Generation and our Active Resource Matrix (RBAC/ABAC).

## 1. Login & Token Negotiation
* **Trigger**: Storefront/Back-Office user submits credentials to `POST /auth/login`.
* **Verification**: Backend validates password against bcrypt-hashed DB record.
* **Token Generation**: Generates short-lived Access Token (JWT) + Long-lived Refresh Token (HttpOnly Cookie or Secure Storage).
* **Caching Prep**: Resolves the user's entire Role + Permissions tree locally from PostgreSQL, flattening it into a minimal dataset, and immediately injects it into Redis underneath the User ID.

## 2. Request Authorization (The Matrix)
* **Trigger**: User accesses protected route (e.g., `POST /orders/:id/cancel`).
* **Gateway Check**: NestJS `AuthGuard` extracts and verifies the Access Token (JWT) integrity and expiration.
* **RBAC Resolution**: The `RolesGuard` queries the Redis cache directly to check if the user holds `admin` or `order_manager` rights.
* **Fast Failure**: If privileges are lacking, request drops at $<1ms$ overhead, never touching DB connection pools.
* **ABAC Refinement (Optional)**: If fine-grained control is required (e.g., "Can user cancel *this specific* order?"), `PolicyGuard` dynamically checks ownership relations against the DB.

## 3. Session Revocation & Renewal
* **Refresh Flow**: When the UI intercepts a `401 Unauthorized`, it attempts silent renewal via the Refresh Token endpoint. New Access Tokens are handed out, and the Redis cache is touched/extended.
* **Logout/Ban**: Rejects Refresh Tokens and immediately purges User IDs from Redis Matrix, enforcing instantaneous system-wide access block.
