# Storefront Security Architecture (Zero-Trust Model)

This document outlines the security refactor of the Ray Paradis storefront, transitioning from an untrusted client-side state to a backend-authoritative, zero-trust architecture.

## 🛡️ Core Security Principles

1. **Zero-Trust Frontend**: The frontend is considered untrusted. All security checks, business logic, and pricing calculations are strictly enforced by the backend.
2. **Backend Authority**: The source of truth for sessions, pricing, and idempotency resides exclusively on the server.
3. **Defense in Depth**: Multiple overlapping security layers (HttpOnly cookies, CSRF tokens, CSP, Session Binding) ensure a resilient system.

---

## 🔐 1. Authentication & Session Management

### HttpOnly Cookies
* **Mechanism**: JWT tokens are no longer stored in `localStorage` (mitigating XSS theft).
* **Implementation**: The backend sets `accessToken` and `refreshToken` as `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
* **Axios Integration**: `axiosClient` is configured with `withCredentials: true` to automatically include these cookies in all requests.

### Synchronized 401 Refresh Flow
* **Problem**: Concurrent requests failing with 401 simultaneously would trigger multiple redundant refresh calls ("Token Storm").
* **Solution**: Implemented a `refreshLock` and request queue in `axiosClient.ts`. Only the first 401 triggers a refresh; subsequent failures are queued and resolved once the session is restored.

### Session Binding (Soft Validation)
* **Mechanism**: A `ua_binding` cookie stores the `User-Agent` that initiated the session.
* **Verification**: `SessionBindingGuard` on the backend detects `User-Agent` mismatches to prevent simple session hijacking across different devices.

---

## 🛡️ 2. CSRF Protection (Double Submit Cookie Pattern)

* **Implementation**: 
    1. Backend sets a non-HttpOnly `csrfToken` cookie on every login/refresh.
    2. Frontend (`axiosClient`) extracts this token and injects it into the `x-csrf-token` header for all mutating requests (`POST`, `PUT`, `DELETE`, `PATCH`).
* **Rotation**: The `csrfToken` is regenerated on every session refresh to limit the attack window.

---

## 💰 3. Pricing & Business Logic Enforcement

* **Pricing Authority**: 
    * Client-side `calculateTotals()` has been removed.
    * The frontend treats `totals` as a read-only snapshot provided by the backend.
* **Checkout Flow**:
    1. **Validate**: Backend takes a snapshot of the cart and returns a signed `checkoutToken`.
    2. **Commit**: Frontend sends the `checkoutToken` to create the order. The backend verifies the token and ensures the cart hasn't changed.

---

## 🔁 4. Idempotency Management

* **Backend-Driven**: 
    * Idempotency is no longer controlled by a frontend-generated UUID.
    * The `jti` (JWT ID) within the `checkoutToken` serves as the authoritative idempotency key.
    * This ensures that a single checkout session can only result in one unique order, regardless of network retries.

---

## 🌐 5. Content Security Policy (CSP)

* **Policy**: Implemented a strict CSP via `SecurityMiddleware`.
* **Features**:
    * `script-src`: Restricted to `'self'` or valid payment providers (VNPAY, PayPal).
    * `nonce`: Support for secure inline script execution (when needed).
    * `frame-ancestors`: Set to `'none'` to prevent clickjacking.

---

## 🚧 Developer Guidelines

* **Never** store sensitive data (tokens, PII) in `localStorage` or `sessionStorage`.
* **Always** use `ProtectedRoute` for routes that require authentication.
* **Don't** perform pricing calculations in the UI for anything other than display hints (label them as "Estimated").
