# Shared Package - Build Instructions

## Cấu trúc

```
shared/
├── src/              # Source code (TypeScript)
│   ├── enums/
│   ├── types/
│   ├── utils/
│   ├── constants/
│   └── config/
├── dist/             # Build output (Dual package: CJS + ESM)
│   ├── index.js      # CommonJS (cho backend)
│   ├── index.mjs     # ESM (cho frontend)
│   └── index.d.ts    # TypeScript types
└── package.json      # Package config với exports field
```

## Dual Package Setup

Package này được build ra **cả CommonJS và ESM** để tương thích với:
- **Backend**: Dùng CommonJS (`dist/index.js`)
- **Frontend/Back Office**: Dùng ESM (`dist/index.mjs`)

Package.json sử dụng `exports` field để tự động resolve đúng format:
- `import` → ESM (`.mjs`)
- `require` → CommonJS (`.js`)

## Build

### Development
```bash
cd shared
npm install
npm run build
```

### Watch Mode (tự động rebuild khi code thay đổi)
```bash
npm run watch
```

## Sử dụng trong Backend

Backend import từ `@shared` (tự động resolve CommonJS):

```typescript
// backend/tsconfig.json
"paths": {
  "@shared": ["../shared/dist/index"],
  "@shared/*": ["../shared/dist/*"]
}

// Usage
import type { User, AuthResponse } from '@shared';
import { API_ENDPOINTS, buildApiUrl } from '@shared';
```

**Lưu ý**: Backend chỉ compile code trong `src/`, không compile shared. Shared phải được build trước.

## Sử dụng trong Frontend/Back Office

Frontend/Back Office import từ `@shared` (tự động resolve ESM):

```typescript
// back-office/vite.config.ts
resolve: {
  alias: {
    '@shared': path.resolve(__dirname, '../shared'),
  }
}

// Usage
import { API_ENDPOINTS, buildApiUrl, SESSION } from '@shared';
import type { User, AuthResponse } from '@shared';
```

Vite sẽ tự động resolve ESM format thông qua `package.json` exports field.

## Workflow

1. **Khi sửa code trong shared**:
   ```bash
   cd shared
   npm run build    # Hoặc npm run watch
   ```

2. **Backend sẽ tự động nhận changes** (nếu dùng `npm run start:dev`)

3. **Frontend/Back Office** sẽ nhận changes khi rebuild

## Troubleshooting

### Lỗi: "Cannot find module '@shared/types'"
- ✅ Đảm bảo đã chạy `npm run build` trong shared
- ✅ Kiểm tra `dist/` folder có tồn tại không
- ✅ Kiểm tra `backend/tsconfig.json` có path alias đúng không

### Lỗi: "File is not under rootDir"
- ✅ Backend `rootDir` phải là `"./src"`
- ✅ Shared đã được build vào `dist/`
- ✅ Backend import từ `../shared/dist/*` (không phải `../shared/*`)

