# Kết nối Back Office với Backend API

## Đã cấu hình

### 1. Environment Variables

Tạo file `.env` trong thư mục `back-office/`:

```env
VITE_API_URL=http://localhost:4000
```

### 2. Backend CORS

Backend đã được cấu hình để cho phép requests từ:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Next.js dev server)
- Các URL từ env variables

### 3. Authentication

- **Auth Store**: Quản lý user và tokens (Zustand với persistence)
- **API Client**: Tự động thêm `Authorization: Bearer <token>` header
- **Auto Logout**: Tự động clear auth khi nhận 401

### 4. API Client Features

- ✅ Tự động thêm auth headers
- ✅ Handle 401 errors (auto logout)
- ✅ Type-safe với TypeScript
- ✅ Error handling

## Cách sử dụng

### 1. Test Connection

Sử dụng component `TestConnection`:

```tsx
import { TestConnection } from '@/components/examples/TestConnection';

function App() {
  return <TestConnection />;
}
```

### 2. Login

```tsx
import { useLogin } from '@/services/mutations';

function LoginForm() {
  const login = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login.mutateAsync({
        email: 'admin@example.com',
        password: 'password123',
      });
      // User sẽ tự động được lưu vào store
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 3. Sử dụng Queries

```tsx
import { useUsers, useMe } from '@/services/queries';

function UsersPage() {
  const { data: users, isLoading } = useUsers({ page: 1, limit: 20 });
  const { data: me } = useMe();

  // ...
}
```

### 4. Check Auth Status

```tsx
import { useAuthStore } from '@/store/auth.store';

function MyComponent() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return <div>Welcome, {user?.fullName}</div>;
}
```

## Kiểm tra kết nối

1. **Start Backend**:
   ```bash
   cd backend
   npm run start:dev
   ```
   Backend sẽ chạy ở `http://localhost:4000`

2. **Start Back Office**:
   ```bash
   cd back-office
   npm install  # Nếu chưa cài
   npm run dev
   ```
   Back Office sẽ chạy ở `http://localhost:5173`

3. **Test**:
   - Mở `http://localhost:5173`
   - Sử dụng component `TestConnection` để test
   - Hoặc thử login với credentials hợp lệ

## Troubleshooting

### CORS Error

Nếu gặp CORS error:
1. Kiểm tra backend đã start chưa
2. Kiểm tra `VITE_API_URL` trong `.env` đúng chưa
3. Kiểm tra backend CORS config trong `backend/src/main.ts`

### 401 Unauthorized

- Token có thể đã hết hạn
- Kiểm tra token có được lưu trong localStorage không
- Thử login lại

### Connection Refused

- Backend chưa start
- Port không đúng (mặc định: 4000)
- Firewall blocking

## API Endpoints

Tất cả endpoints được định nghĩa trong `@shared/config`:

- Auth: `/api/auth/login`, `/api/auth/register`, etc.
- Users: `/api/users`, `/api/users/me`, etc.
- Products: `/api/products`, etc.
- Orders: `/api/orders`, etc.

Xem chi tiết trong `shared/config/api.config.ts`

