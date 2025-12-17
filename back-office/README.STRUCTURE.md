# Back Office - Cấu trúc dự án

## Cấu trúc thư mục

```
back-office/
├── src/
│   ├── app/                    # App-level components (layouts, routes)
│   ├── components/             # Shared UI components
│   │   ├── ui/                 # Base UI components (shadcn, etc.)
│   │   ├── layout/             # Layout components (Header, Sidebar, etc.)
│   │   └── composite/          # Composite components
│   ├── features/              # Feature modules (Domain-driven)
│   │   ├── auth/               # Authentication feature
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── user/               # User management feature
│   │   ├── product/            # Product management feature
│   │   ├── order/              # Order management feature
│   │   └── ...
│   ├── providers/             # React Context providers
│   │   └── index.tsx          # Wrap all providers
│   ├── hooks/                 # Custom React hooks (global)
│   ├── lib/                   # Helper functions, utilities
│   ├── services/              # API services
│   │   └── apiClient.ts       # API client wrapper
│   ├── store/                 # State management (Zustand/Redux)
│   ├── types/                 # TypeScript types (re-export from shared)
│   ├── utils/                 # Utility functions (re-export from shared)
│   ├── config/                # Configuration
│   │   └── constants.ts      # App constants (re-export from shared)
│   ├── assets/                # Static assets
│   ├── App.tsx                # Root component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── public/                    # Public assets
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript config
├── tsconfig.app.json         # TypeScript config for app
├── tsconfig.node.json       # TypeScript config for node
├── package.json             # Dependencies
└── README.md                 # Project README
```

## Path Aliases

- `@/` → `./src/`
- `@shared/*` → `../shared/*`

## Import Examples

```typescript
// From shared
import { OrderStatus, PaymentStatus } from '@shared/enums';
import { User, Order } from '@shared/types';
import { formatCurrency } from '@shared/utils';
import { API_ENDPOINTS, buildApiUrl } from '@shared/config';

// From local
import { apiGet, apiPost } from '@/services/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
```

## Best Practices

1. **Features**: Mỗi feature là một module độc lập với components, hooks, services, types riêng
2. **Shared Code**: Sử dụng `@shared/*` cho types, enums, utils, config dùng chung
3. **Local Code**: Sử dụng `@/` cho code riêng của back-office
4. **State Management**: Dùng Zustand trong `store/`
5. **API Calls**: Tất cả API calls qua `services/apiClient.ts`
6. **Components**: Tách UI components (ui/), layout components (layout/), và composite components (composite/)

