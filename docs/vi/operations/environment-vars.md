# Environment Variables — Reference

> Danh sách đầy đủ tất cả biến môi trường cho từng workspace. Giá trị production được lưu trong secret manager (không commit vào git).

---

## Backend (`backend/.env`)

```bash
# ── Database ──────────────────────────────────────
DATABASE_URL="postgresql://ecommerce_user:ecommerce_pass@localhost:5432/ecommerce"

# ── Redis ─────────────────────────────────────────
REDIS_URL="redis://:redis_pass@localhost:6379"

# ── JWT ───────────────────────────────────────────
JWT_SECRET="your-strong-secret-min-32-chars"
JWT_REFRESH_SECRET="another-strong-secret-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# ── App ───────────────────────────────────────────
NODE_ENV="development"            # development | production | test
PORT=4000
FRONTEND_URL="http://localhost:5173"  # CORS allowed origin

# ── Payment: VNPay ────────────────────────────────
VNPAY_TMN_CODE="your-tmn-code"
VNPAY_HASH_SECRET="your-hash-secret"
VNPAY_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNPAY_RETURN_URL="http://localhost:5173/checkout/vnpay-return"

# ── Payment: PayPal ───────────────────────────────
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
PAYPAL_MODE="sandbox"             # sandbox | live

# ── Email (Mailpit local / SMTP production) ────────
SMTP_HOST="localhost"
SMTP_PORT=1025
SMTP_USER=""
SMTP_PASS=""
MAIL_FROM="noreply@rayparadis.com"

# ── AI Service Internal Auth ──────────────────────
AI_SERVICE_URL="http://localhost:4001"
AI_SERVICE_INTERNAL_TOKEN="internal-service-token"
```

---

## AI Service (`ai-service/.env`)

```bash
# ── Google Gemini API ─────────────────────────────
GEMINI_API_KEY="your-gemini-api-key"

# ── Qdrant ────────────────────────────────────────
QDRANT_URL="http://localhost:6333"
QDRANT_API_KEY=""                 # Để trống nếu local

# ── Redis (cho BullMQ queues) ─────────────────────
REDIS_URL="redis://:redis_pass@localhost:6379"

# ── Auth ──────────────────────────────────────────
AI_SERVICE_INTERNAL_TOKEN="internal-service-token"  # Phải match với backend

# ── App ───────────────────────────────────────────
PORT=4001
NODE_ENV="development"
```

---

## Storefront (`storefront/.env.development`)

```bash
VITE_API_URL="http://localhost:4000"
VITE_PAYPAL_CLIENT_ID="your-paypal-client-id"
```

---

## Back-Office (`back-office/.env`)

```bash
VITE_API_URL="http://localhost:4000"
```

---

## Production Checklist

Trước khi deploy production, đảm bảo:

- [ ] `JWT_SECRET` và `JWT_REFRESH_SECRET` là random string độ dài ≥ 64 characters
- [ ] `NODE_ENV=production`
- [ ] `VNPAY_URL` đổi sang production URL (không phải sandbox)
- [ ] `PAYPAL_MODE=live`
- [ ] `SMTP_HOST` là SMTP server thật (không phải Mailpit)
- [ ] `DATABASE_URL` trỏ đến production database với SSL enabled
- [ ] `FRONTEND_URL` là domain production (cho CORS)
- [ ] Secrets được lưu trong Secret Manager (AWS Secrets Manager, GitHub Secrets, Render Environment), không hardcode
