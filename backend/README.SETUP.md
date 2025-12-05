# Backend Setup & Troubleshooting

## Nguyên nhân lỗi "Cannot find module 'dist/main'"

### Vấn đề:
1. **Path sai**: File build của NestJS nằm ở `dist/backend/src/main.js` (có cấu trúc nested)
2. **Script sai**: Script `start:prod` đang cố chạy `node dist/main` (không có extension và path sai)
3. **Chưa build**: Nếu chưa chạy `npm run build`, folder `dist/` sẽ không tồn tại

### Giải pháp:

#### 1. Sử dụng script đúng:

**Development (không cần build):**
```bash
npm run start:dev
```
- Tự động compile TypeScript
- Hot reload khi code thay đổi
- Không cần build trước

**Production (cần build trước):**
```bash
# Bước 1: Build
npm run build

# Bước 2: Chạy
npm run start:prod
```

#### 2. Scripts đã được sửa:

- ✅ `start:prod`: Đã sửa thành `node dist/backend/src/main.js`
- ✅ `prebuild`: Thêm script để xóa dist cũ trước khi build

## Cấu trúc Build Output

Sau khi build, cấu trúc sẽ là:
```
backend/
└── dist/
    └── backend/
        └── src/
            └── main.js  ← Entry point
```

## Best Practices

1. **Development**: Luôn dùng `npm run start:dev`
   - Không cần build
   - Hot reload
   - Dễ debug

2. **Production**: 
   - Build trước: `npm run build`
   - Chạy: `npm run start:prod`
   - Hoặc dùng PM2/Docker

3. **Kiểm tra build**:
   ```bash
   # Xem file đã build chưa
   ls dist/backend/src/main.js
   ```

## Troubleshooting

### Lỗi: "Cannot find module"
- ✅ Đã fix: Script `start:prod` đã được sửa
- Kiểm tra: Đã chạy `npm run build` chưa?

### Lỗi: "Module not found" khi import
- Kiểm tra: Path aliases trong `tsconfig.json` đã đúng chưa?
- Kiểm tra: Shared package đã được build chưa?

### Build failed
- Xóa dist cũ: `rm -rf dist` (hoặc `rimraf dist` trên Windows)
- Build lại: `npm run build`
- Kiểm tra TypeScript errors: `npx tsc --noEmit`

