# Security Policy (`@ray-paradis/backend`)

This document outlines the security architecture and defensive measures implemented within the Ray Paradis backend to ensure data integrity and user protection.

## 🛡️ Core Security Features

### 1. Global Rate Limiting (`ThrottlerGuard`)
Experimental and production environments are protected by a global rate-limiting guard.
- **Implementation**: `ThrottlerModule` using Redis as a distributed counting storage.
- **Policy**: 100 requests per minute from a single IP, or 10 requests per minute for sensitive endpoints (Auth).
- **Security Note**: While the system allows empty Redis passwords for flexibility, **Production environments should always use a strong `REDIS_PASSWORD`** to prevent unauthorized access to the cache layer.

### 2. Runtime Invariant Enforcement (Staff-level)
The system employs **Zero-Trust for Database Mutations**. 
- **Enforcement**: A custom Prisma Extension intercepts all mutations on sensitive models (`Order`, `Payment`, `InventoryItem`).
- **Authorization**: Mutations are only allowed if the execution context matches a trusted Service layer (e.g., `OrderPaymentService`). 
- **Benefit**: Prevents accidental direct DB access from Controllers or unauthorized modules (Bypass Bug Prevention).

### 3. PII (Personally Identifiable Information) Masking
Sensitive user data is protected at the API response layer.
- **Password Reset**: Email addresses are partially masked in public verification calls (e.g., `j***e@example.com`).
- **User Sanity**: The `sanitizeUser` utility filters out `passwordHash`, `refreshToken`, and internal tracking IDs before any `User` object is returned to the client.

### 4. JWT & Token Rotation
- **Access Tokens**: Short-lived (15 min) for immediate security.
- **Refresh Tokens**: Long-lived (7 days) with **Rotation**. On every refresh request, the old token is invalidated, and a new one is issued (JTI tracking).
- **Revocation**: Passwords changes immediately invalidate all active refresh tokens in the database.

## 🧱 Data Integrity

### 1. Concurrency Control (NOWAIT)
High-stakes commerce transactions use `SELECT FOR UPDATE NOWAIT` at the record level. This ensures atomic stock deductions and prevents race conditions without causing system-wide deadlocks.

### 2. Strict Input Validation
- **Global Pipe**: All incoming DTOs are validated using `class-validator` and `class-transformer`.
- **Whitelisting**: Extraneous properties are stripped from input objects to prevent **Mass Assignment Vulnerabilities**.

## 📞 Reporting Vulnerabilities
If you discover a security vulnerability in this project, please open a private GitHub issue or contact the lead maintainer directly.
