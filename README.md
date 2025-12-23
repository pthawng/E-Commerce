# E-Commerce Monorepo

This repository contains the backend API and back-office (admin) frontend for the E-Commerce project.
It follows a feature-sliced / enterprise-friendly layout and aims to be suitable for production development.

---

## Contents
- `backend/` — NestJS backend API (Prisma, RBAC/ABAC, media, products, auth)
- `back-office/` — React (Vite) admin application (Ant Design, React Query, FSD-inspired)
- `ray-paradis-landingpage/` — Example landing page (separate app)
- `shared/` (or `packages/shared`) — shared types, DTOs and utilities (if present)

---

## High-level Architecture

- Backend: NestJS + Prisma ORM + PostgreSQL. Uses RBAC and ABAC for authorization. Media stored via product storage service (local or cloud).
- Back-office: React + TypeScript + Ant Design. Uses React Query for data fetching and cached queries. Organized using Feature-Sliced principles: `features/`, `components/`, `services/`, `hooks/`.
- Communication: REST API under `/api` with JSON; file uploads use multipart/form-data and FormData.
- Transactions: Product create/update flows use Prisma transactions to ensure atomic updates (product, variants, media, categories).

---

## Quickstart (Development)

Prerequisites:
- Node.js 18+ (or LTS), npm/yarn/pnpm
- PostgreSQL (or Docker for local DB)
- (Optional) Redis, MinIO / S3 if media/storage configured

1. Install dependencies (root optional if each package has its own):

```bash
# from repo root, run for each workspace if using workspaces
cd backend && npm install
cd ../back-office && npm install
```

2. Database

- Configure `.env` files:
  - `backend/.env` — set `DATABASE_URL`, `JWT_SECRET`, `PORT`, storage settings
  - `back-office/.env` — set `VITE_API_BASE_URL` (or similar)

- Run migrations (from `backend/`):

```bash
cd backend
npx prisma migrate dev --name init
# or if you have a seed script:
npx prisma db seed
```

3. Run apps

- Backend (dev with hot reload)
```bash
cd backend
npm run start:dev
```

- Back-office (dev)
```bash
cd back-office
npm run dev
```

4. API docs
- If enabled, open Swagger at `http://localhost:4000/api/docs` (or check backend config).

---

## Useful Scripts

- Backend
  - `npm run start:dev` — start in development
  - `npm run build` — build production artifact
  - `npm run start:prod` — run production build
  - `npx prisma generate` — regenerate Prisma client
  - `npx prisma migrate dev` — run migrations

- Back-office
  - `npm run dev` — start dev server
  - `npm run build` — build production assets
  - `npm run preview` — preview build
  - `npm run lint` — run ESLint
  - `npm run format` — run Prettier

---

## Project Structure Notes (Back-office)

Top-level folders:

- `src/app/` — app-level routing and layouts
- `src/components/` — shared UI split into `ui/`, `layout/`, `composite/`
- `src/features/` — feature modules (each feature owns components, hooks, services, types)
- `src/services/` — shared API clients and service utilities
- `src/hooks/` — global hooks
- `src/lib/` — helpers and shared utilities
- `src/config/` — constants and configuration
- `src/assets/` — static assets

Best practices used in this repo:
- Keep feature boundaries thin: feature-local types and services should not be imported broadly.
- Use `Form` keys or remounting to avoid stale initial values in modals.
- Use React Query for caching and set appropriate `staleTime`/`cacheTime`.

---

## Authorization (RBAC & ABAC)

- RBAC: role-based permission slugs are defined in `backend/src/modules/rbac/permissions.constants.ts`.
- ABAC: attribute-based policies for resources live under `backend/src/modules/abac/`.
- When adding new resources (e.g., `product.variant`) add permission slugs and update ABAC model map so guard resolves resource instances correctly.

---

## Media & Variants

- Media should be uploaded at the product level (product gallery). Variants reference product media by id and order index — do not allow variants to upload independent duplicate media to avoid duplication.
- Product creation flow recommended:
  1. Create product (draft, isActive=false) with basic details and gallery.
  2. Edit product → Variants tab → create variants referencing gallery images.
  3. Publish once variants exist.

---

## Contributing

- Follow existing code style: TypeScript with strict types, descriptive variable names, and clear separation of concerns.
- Add unit/integration tests for backend services and critical flows (product create/update with transaction).
- Keep PRs focused and include migration scripts if schema changes.

---

## Troubleshooting & Tips

- Stale form state: prefer providing `key` to force remount or set fields with `form.setFieldsValue` when opening modals; avoid synchronous setState inside effects.
- Validation issues with FormData: backend DTOs should use `class-transformer` (e.g., `@Type(() => Number)`) and `@Transform` for arrays when receiving form uploads.
- If product images don't appear: check backend response mapping and `thumbnailUrl` vs `media[]` fallbacks.


Contact / Maintainers
- Repo owner: https://www.facebook.com/phuocthang.le.04/


