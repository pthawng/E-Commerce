# API Reference — Xác thực & Session

> **Swagger UI (nguồn chính xác nhất):** `http://localhost:4000/api/docs`
>
> Tài liệu này giải thích **convention xác thực** — không liệt kê từng endpoint (Swagger đã làm điều đó). Đọc trước khi tích hợp API.

---

## 1. Hai Hệ thống Xác thực

Ray Paradis có hai auth system hoàn toàn độc lập:

| | Storefront API | Back-Office API |
|-|----------------|-----------------|
| **Prefix** | `/api/` | `/api/admin/` |
| **Login endpoint** | `POST /api/auth/login` | `POST /api/back-office/auth/login` |
| **Cookie name** | `access_token` | `bo_access_token` |
| **Token type** | JWT (15 phút) | JWT (15 phút) |
| **Người dùng** | Khách hàng (storefront) | Nhân viên (back-office) |

---

## 2. Cookie-Based Authentication

Hệ thống dùng **HTTP-Only Cookie** — không cần thêm header thủ công trong browser environment.

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secret"
}

→ Response:
Set-Cookie: access_token=eyJ...; HttpOnly; Secure; SameSite=Strict; Max-Age=900
Set-Cookie: refresh_token=eyJ...; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh; Max-Age=604800
```

Sau khi login, browser **tự động gửi cookie** trên mọi request đến cùng domain — không cần code thêm.

---

## 3. Tích hợp từ Frontend (React)

```typescript
// ✅ Đúng — luôn thêm credentials: 'include' để gửi cookie cross-origin
const response = await fetch('http://localhost:4000/api/profile', {
  credentials: 'include',
});

// ✅ Với TanStack Query
const { data } = useQuery({
  queryKey: ['profile'],
  queryFn: () => api.get('/profile', { withCredentials: true }),
});

// ❌ Sai — thiếu credentials → cookie không được gửi → 401
const response = await fetch('http://localhost:4000/api/profile');
```

---

## 4. Token Refresh

Access token hết hạn sau 15 phút. Client phải tự xử lý refresh:

```typescript
// Interceptor pattern (axios example)
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      // Gọi refresh — dùng refresh_token cookie tự động
      await axios.post('/api/auth/refresh', {}, { withCredentials: true });
      
      // Retry request gốc
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## 5. Tích hợp với Swagger UI (Phát triển)

Swagger UI tại `http://localhost:4000/api/docs` dùng cookie authentication.

1. Gọi `POST /api/auth/login` trong Swagger UI
2. Cookie tự động được set trong browser
3. Tất cả request sau trong cùng browser tab đều được authenticated

> **Lưu ý**: Nếu test từ Postman hay curl, cần lưu cookie manually:
> ```bash
> curl -c cookies.txt -X POST http://localhost:4000/api/auth/login \
>   -H "Content-Type: application/json" \
>   -d '{"email":"admin@example.com","password":"secret"}'
>
> curl -b cookies.txt http://localhost:4000/api/profile
> ```

---

## 6. Public Endpoints

Một số endpoints không cần xác thực (decorated với `@Public()`):

- `GET /api/products` — danh sách sản phẩm public
- `GET /api/products/:slug` — chi tiết sản phẩm
- `GET /api/categories` — danh mục
- `POST /api/auth/login` — đăng nhập
- `POST /api/auth/register` — đăng ký
- `POST /api/webhooks/vnpay` — VNPay IPN (bảo mật bằng HMAC signature)
- `POST /api/webhooks/paypal` — PayPal webhook (bảo mật bằng JWT signature)

---

## 7. CSRF Protection

Các request **thay đổi dữ liệu** (POST, PATCH, PUT, DELETE) cần CSRF token:

```typescript
// Lấy CSRF token (readable cookie, set khi load app)
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrf_token='))
  ?.split('=')[1];

// Gửi trong header
await fetch('/api/orders', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(orderData),
});
```

> CSRF protection chỉ áp dụng cho browser clients. Webhook endpoints được exempt.
