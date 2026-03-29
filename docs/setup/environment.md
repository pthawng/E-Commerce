# Environment Variables

This document defines the critical `.env` contracts required by the backend engine. Ensure these correspond perfectly with infrastructure deployments (Supabase/Docker/Render).

## Global
```bash
# Node environment execution path
NODE_ENV=development # or production
PORT=4000
```

## Database
```bash
# Prisma strictly formats this string dynamically.
# Example: postgresql://postgres:password@localhost:5432/ray_paradis?schema=public
DATABASE_URL="native_psql_connection_string"
```

## Redis Cache
```bash
# Memory Layer configuration for Authorization tree & Rate Limiting
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD= # Blank for local
```

## External Gateways
```bash
# VNPAY Sandbox / Production
VNPAY_TMNCODE=xyz123
VNPAY_HASHSECRET=abc456
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5173/checkout/vnpay/callback
# Important: This parameter points to the backend!
VNPAY_IPN_URL=http://localhost:4000/api/payment/vnpay/ipn
```

## Security
```bash
# Used internally to mutate JWT tokens. Must strictly rotate!
JWT_ACCESS_SECRET="generate_me_via_openssl"
JWT_REFRESH_SECRET="generate_me_via_openssl_2"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Frontend Domains - strict protection over Origin spoofing
CORS_ORIGIN="http://localhost:5173,http://localhost:3000"
```
