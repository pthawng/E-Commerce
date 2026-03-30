# Auth Flow

This document details the lifecycle of User Authentication and Authorization through Token Generation and our Active Resource Matrix (RBAC/ABAC).

## 1. Login & Token Negotiation
* **Trigger**: Storefront/Back-Office user submits credentials to `POST /auth/login`.
* **Verification**: Backend validates password against bcrypt-hashed DB record.
* **Token Generation**: Generates short-lived Access Token and long-lived Refresh Token. Both are attached exclusively as `HttpOnly`, `Secure`, `SameSite=Lax` cookies to prevent XSS exfiltration. A rotating `x-csrf-token` is also issued.
* **Session Binding**: Generates a `User-Agent` hash cookie to bind the session defensively against token hijacking.
* **Caching Prep**: Resolves the user's entire Role + Permissions tree locally from PostgreSQL, flattening it into a minimal dataset, and immediately injects it into Redis underneath the User ID.

## 2. Request Authorization (The Matrix)
* **Trigger**: User accesses protected route (e.g., `POST /orders/:id/cancel`).
* **Gateway Check (Zero-Trust)**: NestJS `JwtAccessStrategy` extracts the Access Token *only* from the securely transmitted `accessToken` cookie.
* **CSRF & Binding Validation**: `SecurityMiddleware` verifies `x-csrf-token` headers against the `csrfToken` cookie, while `SessionBindingGuard` verifies User-Agent consistency.
* **RBAC Resolution**: The `RolesGuard` queries the Redis cache directly to check if the user holds `admin` or `order_manager` rights.
* **Fast Failure**: If privileges are lacking, request drops at $<1ms$ overhead, never touching DB connection pools.
* **ABAC Refinement (Optional)**: If fine-grained control is required (e.g., "Can user cancel *this specific* order?"), `PolicyGuard` dynamically checks ownership relations against the DB.

## 3. Session Revocation & Renewal
* **Refresh Flow (Anti-Storm)**: When the Axios interceptor hits a `401 Unauthorized`, it queues subsequent requests and attempts silent renewal via the Refresh Token endpoint. New Access and CSRF cookies are set securely, and queued requests resume.
* **Logout/Ban**: Deletes all browser session cookies immediately and purges User IDs from Redis Matrix, enforcing instantaneous system-wide access block.
