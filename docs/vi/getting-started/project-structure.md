# Cấu trúc Project — Monorepo Ray Paradis

```
ray-paradis/                    ← Root workspace (npm workspaces)
├── package.json                ← Root scripts: npm run dev chạy tất cả
├── tsconfig.json               ← Base TypeScript config
│
├── backend/                    ← @ray-paradis/backend
│   ├── src/
│   │   ├── app.module.ts       ← Root module, đăng ký toàn bộ modules
│   │   ├── prisma/             ← PrismaService (singleton)
│   │   └── modules/            ← 24 business modules
│   │       ├── auth/           ← Xác thực storefront
│   │       ├── back-office-auth/ ← Xác thực back-office
│   │       ├── rbac/           ← Phân quyền RBAC/ABAC
│   │       ├── order/          ← Đặt hàng
│   │       ├── payment/        ← Thanh toán (VNPay, PayPal)
│   │       ├── inventory/      ← Kho bãi, két sắt
│   │       ├── product/        ← Sản phẩm, biến thể
│   │       ├── cart/           ← Giỏ hàng
│   │       ├── ledger/         ← Sổ cái tài chính
│   │       ├── ai/             ← AI search coordination
│   │       └── ...             ← 14 modules khác
│   └── prisma/
│       ├── schema.prisma       ← Single source of truth cho database schema
│       ├── migrations/         ← Lịch sử migrations (commit cùng code)
│       └── seed.ts             ← Dữ liệu mẫu: permissions, roles, products
│
├── storefront/                 ← @ray-paradis/storefront
│   └── src/
│       ├── features/           ← Feature-Sliced Design (FSD)
│       │   ├── product/
│       │   ├── cart/
│       │   └── checkout/
│       └── shared/             ← Components, hooks, utils dùng chung
│
├── back-office/                ← @ray-paradis/back-office
│   └── src/
│       └── features/           ← Feature modules (catalog, order, inventory...)
│
├── ai-service/                 ← @ray-paradis/ai-service
│   └── src/                    ← NestJS + BullMQ + Qdrant + Gemini API
│
├── shared/                     ← @ecommerce/shared
│   └── src/
│       ├── types/              ← TypeScript interfaces dùng chung
│       └── schemas/            ← Zod schemas cho validation
│
├── infra/
│   ├── docker-compose.dev.yml  ← Development infrastructure
│   ├── k8s/                    ← K8s reference manifests (starter only)
│   └── terraform/              ← AWS Terraform starter templates
│
├── docs/                       ← Tài liệu này (Mintlify)
│
└── .github/
    └── workflows/              ← CI/CD GitHub Actions
```

---

## Quy ước Đặt tên File

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Service | `[name].service.ts` | `order.service.ts` |
| Controller | `[name].controller.ts` | `payment.controller.ts` |
| Module | `[name].module.ts` | `inventory.module.ts` |
| DTO | `[action]-[resource].dto.ts` | `create-order.dto.ts` |
| Guard | `[name].guard.ts` | `rbac.guard.ts` |
| Test | `[name].spec.ts` trong `__tests__/` | `order.service.spec.ts` |

---

## Import Convention

```typescript
// 1. Node.js built-ins
import { randomUUID } from 'crypto';

// 2. External packages (@nestjs, prisma, etc.)
import { Injectable } from '@nestjs/common';

// 3. Internal absolute paths
import { PrismaService } from 'src/prisma/prisma.service';

// 4. Relative imports
import { CreateOrderDto } from './dto/create-order.dto';
```
