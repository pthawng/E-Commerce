# ADR-002: Xác thực bằng HTTP-Only Cookie thay vì localStorage JWT

**Trạng thái**: `Accepted`
**Ngày**: 2025-01-01
**Tác giả**: Ray Paradis Engineering

---

## Bối cảnh

Hệ thống cần cơ chế xác thực cho hai loại client:
1. **Storefront** (React SPA) — khách hàng mua hàng
2. **Back-Office** (React SPA) — nhân viên vận hành, quản lý

Cần chọn cách lưu trữ và truyền tải token xác thực bảo mật, cân bằng giữa UX và security.

---

## Quyết định

Sử dụng **HTTP-Only Cookie** cho cả Access Token và Refresh Token.

Cấu hình cụ thể:
```typescript
// auth.service.ts
res.cookie('access_token', accessToken, {
  httpOnly: true,      // ← Không thể đọc bằng JavaScript
  secure: true,        // ← Chỉ gửi qua HTTPS
  sameSite: 'strict',  // ← Bảo vệ CSRF cơ bản
  maxAge: 15 * 60 * 1000, // 15 phút
});

res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/api/auth/refresh', // ← Chỉ gửi đến endpoint refresh
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
});
```

Kết hợp với **CSRF Double Submit Cookie** cho các request thay đổi dữ liệu (POST, PATCH, DELETE).

---

## Hệ quả (Consequences)

**Tích cực:**
- ✅ **Chống XSS**: JavaScript không thể đọc token ngay cả khi bị inject script độc hại
- ✅ **Automatic transmission**: Browser tự gửi cookie, không cần xử lý trong frontend code
- ✅ **Refresh token path restriction**: Refresh token chỉ đi kèm request đến `/api/auth/refresh`
- ✅ **Rotate on use**: Mỗi lần refresh sẽ invalidate token cũ và cấp token mới

**Tiêu cực / Trade-off:**
- ⚠️ **Khó test với Swagger UI**: Cần cấu hình `credentials: 'include'` trong fetch
- ⚠️ **CORS phức tạp hơn**: Phải cấu hình `allowedOrigins` và `credentials: true` chính xác
- ⚠️ **Mobile app**: Nếu sau này có native app thì cần thêm Bearer token flow song song

---

## Phương án đã loại bỏ

### localStorage / sessionStorage JWT
**Lý do loại bỏ**: Dễ bị đánh cắp bởi XSS attack. Với e-commerce trang sức cao cấp, nếu token bị đánh cắp, hacker có thể đặt hàng bằng account người dùng. Rủi ro không chấp nhận được.

### Token trong memory (React state)
**Lý do loại bỏ**: Mất token khi refresh trang, UX kém. Cần logic phức tạp để restore session.

---

## Liên quan

- [`auth.controller.ts`](file:///e:/Ray%20Paradis/backend/src/modules/auth/auth.controller.ts) — Cookie set/clear logic
- [`auth.service.ts`](file:///e:/Ray%20Paradis/backend/src/modules/auth/auth.service.ts) — Token generation và rotation
- [Security Overview](../../security/overview.md) — Mô hình bảo mật tổng thể
