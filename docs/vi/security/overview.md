# Bảo mật — Tổng quan Mô hình Bảo mật

> Tài liệu này mô tả các lớp bảo mật của Ray Paradis. Mỗi lớp bảo vệ một attack surface khác nhau.

---

## 1. Defense in Depth — Các Lớp Bảo vệ

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Transport          HTTPS only, HSTS header      │
├─────────────────────────────────────────────────────────┤
│ Layer 2: Authentication     HTTP-Only Cookie, CSRF Token  │
├─────────────────────────────────────────────────────────┤
│ Layer 3: Authorization      RBAC Guard, ABAC override    │
├─────────────────────────────────────────────────────────┤
│ Layer 4: Input Validation   class-validator DTO pipeline │
├─────────────────────────────────────────────────────────┤
│ Layer 5: Database           Prisma parameterized queries │
│                             Check Constraints            │
├─────────────────────────────────────────────────────────┤
│ Layer 6: Business Logic     Idempotency keys, Audit Log  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Authentication Security

| Mechanism | Bảo vệ chống |
|-----------|-------------|
| HTTP-Only Cookie | XSS token theft |
| `SameSite=Strict` | CSRF cơ bản |
| CSRF Double Submit | CSRF nâng cao |
| Refresh Token Rotation | Token replay |
| Revocation on suspicious reuse | Token theft detection |
| `path=/api/auth/refresh` restriction | Refresh token scope leakage |

Chi tiết: [ADR-002 HTTP-Only Cookie Auth](../architecture/adr/002-http-only-cookie-auth.md)

---

## 3. Authorization — RBAC + ABAC

- **RBAC**: Permission được gán qua Roles
- **ABAC**: User có thể có direct permission grants hoặc explicit denies
- **Cache**: Permission trees được cache Redis 1h, invalidated khi có thay đổi
- **Guard**: `@RequirePermissions()` decorator enforced ở controller level

Chi tiết: [RBAC Module Overview](../modules/rbac/overview.md)

---

## 4. Payment Security

| Mechanism | Mục đích |
|-----------|---------|
| VNPay HMAC-SHA512 signature | Xác thực webhook nguồn gốc |
| PayPal JWT verification | Xác thực webhook nguồn gốc |
| `providerTransactionId` uniqueness | Chống double-charge |
| PayPal `jti` Redis dedup | Chống JWT replay attack |
| Idempotency key | Chống duplicate order creation |

Chi tiết: [Payment Module](../modules/payment/overview.md)

---

## 5. Data Integrity

| Mechanism | Bảo vệ |
|-----------|--------|
| Prisma parameterized queries | SQL Injection |
| Check Constraints (Postgres) | Âm tồn kho, reserved > quantity |
| Pessimistic Locking | Race condition overselling |
| Transaction atomicity | Partial update data corruption |

Chi tiết: [ADR-003 Inventory Locking](../architecture/adr/003-inventory-locking-strategy.md)

---

## 6. Audit Trail

Hai hệ thống audit log độc lập để compliance:
- **InventoryLog**: Biến động vật lý tồn kho
- **BackOfficeAuditLog**: Hành vi admin với snapshot trước/sau

Chi tiết: [Audit Log](./audit-log.md)

---

## 7. Security Checklist Định kỳ

Thực hiện kiểm tra mỗi quý:

- [ ] Rotate JWT secrets
- [ ] Review active admin accounts — deactivate tài khoản không còn dùng
- [ ] Review `UserPermission` direct grants — có grant nào bất thường không?
- [ ] Kiểm tra `BackOfficeAuditLog` cho activity bất thường (giờ lạ, IP lạ)
- [ ] `npm audit` — patch security vulnerabilities
- [ ] Review exposed endpoints: tất cả admin endpoints có đúng permission không?
- [ ] Test CSRF protection còn hoạt động không
- [ ] Kiểm tra cookie flags production: `HttpOnly`, `Secure`, `SameSite=Strict`
