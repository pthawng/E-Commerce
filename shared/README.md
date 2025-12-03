# @ecommerce/shared

Shared package chứa types, enums, utils, và constants dùng chung giữa Backend (NestJS), Frontend (Next.js), và Back Office (React + Vite).

## Cấu trúc

```
shared/
├── enums/          # Enums (OrderStatus, PaymentStatus, Permission, etc.)
├── types/          # TypeScript types (User, Order, Product, API Response, etc.)
├── utils/          # Utility functions (format, string manipulation)
├── constants/      # Constants (labels, configs)
├── config/         # Configuration (API URLs, app settings, etc.)
└── index.ts        # Entry point
```

## Cài đặt

### Backend (NestJS)

1. Thêm path alias trong `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  }
}
```

2. Import và sử dụng:
```typescript
import { OrderStatus, PaymentStatus } from '@shared/enums';
import { User, Order } from '@shared/types';
import { formatCurrency, formatDate } from '@shared/utils';
import { ORDER_STATUS_LABELS } from '@shared/constants';
```

### Frontend (Next.js)

1. Thêm path alias trong `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  }
}
```

2. Import và sử dụng:
```typescript
import { OrderStatus } from '@shared/enums';
import { User, ApiResponse } from '@shared/types';
import { formatCurrency } from '@shared/utils';
```

### Back Office (React + Vite)

1. Thêm path alias trong `tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  }
}
```

2. Cấu hình Vite alias trong `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
});
```

3. Import và sử dụng:
```typescript
import { OrderStatus } from '@shared/enums';
import { User } from '@shared/types';
import { formatCurrency } from '@shared/utils';
```

## Ví dụ sử dụng

### Enums
```typescript
import { OrderStatus, PaymentStatus } from '@shared/enums';

const order = {
  status: OrderStatus.PENDING,
  paymentStatus: PaymentStatus.UNPAID,
};
```

### Types
```typescript
import { User, Order, ApiResponse } from '@shared/types';

const user: User = {
  id: '123',
  email: 'user@example.com',
  fullName: 'John Doe',
  isActive: true,
  isEmailVerified: true,
};

const response: ApiResponse<Order> = await fetch('/api/orders/123');
```

### Utils
```typescript
import { formatCurrency, formatDate, slugify } from '@shared/utils';

const price = formatCurrency(1000000); // "1.000.000 ₫"
const date = formatDate(new Date()); // "02/12/2025"
const slug = slugify('Hello World'); // "hello-world"
```

### Constants
```typescript
import { ORDER_STATUS_LABELS, DEFAULT_PAGE, DEFAULT_LIMIT } from '@shared/constants';

const label = ORDER_STATUS_LABELS[OrderStatus.PENDING]; // "Chờ xử lý"
const page = DEFAULT_PAGE; // 1
const limit = DEFAULT_LIMIT; // 20
```

### Config
```typescript
import { API_BASE_URL, buildApiUrl, API_ENDPOINTS, PAGINATION } from '@shared/config';

// Get API base URL (tự động detect Next.js hoặc Vite env)
const baseUrl = API_BASE_URL; // "http://localhost:4000"

// Build full API URL
const loginUrl = buildApiUrl(API_ENDPOINTS.AUTH.LOGIN); // "http://localhost:4000/api/auth/login"

// Use endpoints
const productsUrl = buildApiUrl(API_ENDPOINTS.PRODUCTS.BASE);
const productUrl = buildApiUrl(API_ENDPOINTS.PRODUCTS.BY_ID('123'));

// Pagination config
const page = PAGINATION.DEFAULT_PAGE; // 1
const limit = PAGINATION.DEFAULT_LIMIT; // 20
```

## Build

Để build shared package (nếu cần):

```bash
cd shared
npm install
npm run build
```

## Lưu ý

- Shared package không nên có dependencies nặng (chỉ TypeScript types và pure functions)
- Không import code phụ thuộc framework (NestJS decorators, React hooks, etc.)
- Tất cả code trong shared phải là pure TypeScript/JavaScript

