# Local Development

Setup for engineering operations.

## 1. Prerequisites
- Docker Engine & Docker Compose
- Node.js `v20+`
- NPM workspaces aware (`v9+`)

## 2. Infrastructure Boot Initialization
We use Docker exclusively for local peripheral dependencies preventing "works on my machine" host-port conflicts.

```bash
# Enter database environment folder
cd database

# Boot local PostgreSQL DB and Redis instance
docker compose -f compose.dev.yaml up -d
```
*Tip: Access the database directly at `localhost:5432` if using DBeaver or PgAdmin.*

## 3. Database Calibration
With backend standing down, prepare the Prisma structure.

```bash
cd backend

# Align DB structure with Prisma schema
npx prisma migrate dev

# Populate required RBAC/Taxonomy structural arrays
npx prisma db seed
```

## 4. Bootstrapping Clients
Boot the monolithic workspace entirely at the root.

```bash
cd /root/path

npm install

# Utilizing NPM Workspaces to orchestrate all DEV runners
npm run dev --workspaces
```

* Backend listens on `:4000` (Default)
* Storefront listens on `:5173` (Default Vite)
* Back-Office listens on `:3000` (Default)

## 5. Webhook Testing (VNPay / PayPal)
Localhost environments naturally block external webhooks (VNPAY IPNs).
To develop against payment success:
1. Fire up a tunneling service (e.g., `ngrok http 4000`).
2. Supply the generated `https://[xyz].ngrok.io/payment/vnpay/ipn` to the local `.env` definition `VNPAY_RETURN_URL/IPN_URL`.
