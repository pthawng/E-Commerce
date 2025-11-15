
src/
 ├── app/                      # App Router: layout, page, metadata, SSR, route handlers
 │   ├── [locale]/             # Dynamic route cho đa ngôn ngữ (i18n)
 │   │   ├── (public)/          # Các route public (home, shop, login)
 │   │   ├── (private)/         # Các route cần auth (profile, checkout, dashboard)
 │   │   ├── layout.tsx        # Layout cho từng ngôn ngữ
 │   │   └── page.tsx          # Trang chủ cho từng ngôn ngữ
 │   ├── api/                  # Optional: API route (nếu dùng proxy hoặc xử lý edge)
 │   ├── layout.tsx            # Layout gốc của toàn bộ ứng dụng
 │   └── page.tsx              # Trang chủ mặc định (thường redirect sang locale)
 │
 ├── components/               # Shared UI components
 |   ├─ui/                      ← component gốc từ từng library
 │   |   ├─ shadcn/
 │   |   ├─ radix/
 │   |   └─ mui/
 |   ├── base/                   ← wrapper + brand token (1 nơi dùng tất cả library)
 │   ├── layout/               # Header, Footer, Sidebar...
 │   └── composite/            # Component phức tạp: ProductCard, CartItem...
 │
 ├── providers/                # ✅ Tách riêng các provider
 │   ├── AuthProvider.tsx
 │   ├── ThemeProvider.tsx
 │   ├── CartProvider.tsx      # Nếu bạn dùng Context cho cart
 │   ├── QueryClientProvider.tsx
 │   ├── ToastProvider.tsx
 │   └── index.tsx             # Wrap tất cả provider lại
 │
 ├── features/                 # Mô-đun chức năng (Domain Feature – đúng DDD FE)
 │   ├── auth/
 │   │   ├─ components/
 │   │   ├─ hooks/
 │   │   ├─ services/
 │   │   └─ types/
 │   ├── cart/
 │   ├── product/
 │   └── user/
 │
 ├── hooks/                    # Custom hooks (e.g. useAuth, useDebounce) global reusables
 ├── lib/                      # Helper logic (fetcher, API client, utils, constants)
 │   ├── i18n/                 # Cấu hình đa ngôn ngữ (locales, config)
 │   │   ├─ locales/
 │   │   └── i18n.ts               # Cấu hình chính cho next-intl
 │   ├── fetcher.ts            # Wrapper cho fetch/axios để gọi API
 │   └── constants.ts          # Các hằng số dùng chung toàn ứng dụng
 ├── store/                    # Zustand, Redux, Recoil... (state management Zustand / Redux / Recoil)
 ├── services/                 # Gọi API (kết nối đến NestJS hoặc 3rd party)
 ├── middleware/ or proxy.ts   # Edge middleware (vẫn cần cho bảo mật/caching)
 ├── styles/                   # CSS/tailwind, global.scss
 ├── types/                    # TypeScript types/interfaces (DTO, model)
 ├── config/                   # Env config, API_URL, constant...
 ├── tests/                    # Unit, integration tests (Vitest/Jest, Playwright)
 └── utils/                    # Format, date, validate, sanitize...


🔹 Layer Logic
[ UI Layer ]
Components (ui/layout/composite) → local state / props

[ State Layer ]
- Local state (component)
- Global state (store: Zustand/Redux/Context)
- Derived / computed state (selectors, useMemo)

[ Feature / Domain Layer ]
- features/* modules
- hooks
- services (API wrapper per module)
- types

[ API / Service Layer ]
- services/
- fetch / Axios / React Query / SWR

[ Config / Utils Layer ]
- config/
- utils/
- styles/tokens

[ Middleware / Edge Layer ]
- auth guard
- caching / rate-limit



💡 Key notes:
FE logic flow:  Components → Hooks → Store → Services → API → Backend

State & UI:
    - Theme, modal, toast → Context or store
    - Form state → local + hooks
    - Server data → React Query / SWR

Scalability:
    - features/ → mỗi module tách riêng: components + hooks + services + types
    - styles/ → tokens + component styles → dễ maintain theme / dark mode
    
Testing:
    - tests/unit → component logic
    - tests/integration → features
    - tests/e2e → full flow (cart, checkout, auth)


WORK FLOW COMPONET
     UI library + Custom layer + Page
    
               ┌──────────────────────────┐
               │       UI Libraries       │
               │ shadcn/ui, Radix, MUI...│
               │ (Button, Input, Modal…) │
               └─────────────┬──────────┘
                             │ component gốc
                             ▼
               ┌──────────────────────────┐
               │         ui/              │
               │ folder tách theo source  │
               │ shadcn/, radix/, mui/   │
               └─────────────┬──────────┘
                             │ import component gốc
                             ▼
               ┌──────────────────────────┐
               │         base/            │
               │ wrapper layer + tokens   │
               │ map props, brand theme   │
               └─────────────┬──────────┘
                             │ chuẩn hóa API + style
                             ▼
               ┌──────────────────────────┐
               │      composite/          │
               │ kết hợp nhiều base       │
               │ component + logic riêng  │
               └─────────────┬──────────┘
                             │ reusable complex component
                             ▼
               ┌──────────────────────────┐
               │         layout/          │
               │ MainLayout, AuthLayout, │
               │ DashboardLayout         │
               └─────────────┬──────────┘
                             │ bao bọc page
                             ▼
               ┌──────────────────────────┐
               │          pages/          │
               │ nội dung UI, gọi composite│
               │ hoặc base component       │
               └──────────────────────────┘
