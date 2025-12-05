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
├── dist/             # Build output (JavaScript + .d.ts)
└── package.json      # Package config
```

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

Backend đã được cấu hình để import từ `dist/`:

```typescript
// backend/tsconfig.json
"paths": {
  "@shared/*": ["../shared/dist/*"]
}
```

**Lưu ý**: Backend chỉ compile code trong `src/`, không compile shared. Shared phải được build trước.

## Sử dụng trong Frontend/Back Office

Frontend và Back Office có thể import trực tiếp từ source hoặc từ dist (tùy cấu hình bundler).

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

