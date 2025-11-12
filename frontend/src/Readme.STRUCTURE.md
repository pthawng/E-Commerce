src/
 ├── app/                      # App Router: layout, page, metadata, SSR, route handlers
 │   ├── (public)/             # Các route public (home, shop, login)
 │   ├── (private)/            # Các route cần auth (profile, checkout, dashboard)
 │   ├── api/                  # Optional: API route (nếu dùng proxy hoặc xử lý edge)
 │   ├── layout.tsx
 │   └── page.tsx
 │
 ├── components/               # Shared UI components
 │   ├── ui/                   # Button, Input, Card... (shadcn/ui hoặc custom)
 │   ├── layout/               # Header, Footer, Sidebar...
 │   └── composite/            # Component phức tạp: ProductCard, CartItem...
 │
 ├── features/                 # Mô-đun chức năng (Domain Feature – đúng DDD FE)
 │   ├── auth/
 │   ├── cart/
 │   ├── product/
 │   └── user/
 │
 ├── hooks/                    # Custom hooks (e.g. useAuth, useDebounce)
 ├── lib/                      # Helper logic (fetcher, API client, utils, constants)
 ├── store/                    # Zustand, Redux, Recoil... (state management)
 ├── services/                 # Gọi API (kết nối đến NestJS hoặc 3rd party)
 ├── middleware/ or proxy.ts   # Edge middleware (vẫn cần cho bảo mật/caching)
 ├── styles/                   # CSS/tailwind, global.scss
 ├── types/                    # TypeScript types/interfaces (DTO, model)
 ├── config/                   # Env config, API_URL, constant...
 ├── tests/                    # Unit, integration tests (Vitest/Jest, Playwright)
 └── utils/                    # Format, date, validate, sanitize...
