# Sử dụng @shared trong Backend

## Tổng quan

Backend đã được cấu hình để sử dụng shared types, enums, và constants từ package `@shared`.

## Cấu hình

### tsconfig.json
```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../shared/dist/*"]
    }
  }
}
```

**Lưu ý**: Backend import từ `dist/`, không phải `src/`. Shared package phải được build trước.

## Import Shared Types

### Cách 1: Import trực tiếp
```typescript
import type { User, AuthResponse } from '@shared/types';
import { PermissionModule, PermissionAction } from '@shared/enums';
```

### Cách 2: Import từ helper (khuyến nghị)
```typescript
import type { User, AuthResponse } from '@common/types/shared.types';
import { PermissionModule, PermissionAction } from '@common/types/shared.types';
```

## Các Types/Enums có sẵn

### Auth Types
- `AuthResponse` - Response từ login/register/refresh
- `AuthTokens` - Access token và refresh token
- `LoginPayload` - Payload cho login
- `RegisterPayload` - Payload cho register
- `ChangePasswordPayload` - Payload cho đổi mật khẩu
- `ForgotPasswordPayload` - Payload cho quên mật khẩu
- `ResetPasswordPayload` - Payload cho reset mật khẩu
- `VerifyEmailPayload` - Payload cho verify email

### User Types
- `User` - Base user type
- `UserSummary` - User summary (cho list)
- `UserWithRoles` - User với roles và permissions
- `Role` - Role type
- `Permission` - Permission type

### API Types
- `ApiResponse<T>` - Standard API response format
- `PaginatedResponse<T>` - Paginated response
- `PaginationMeta` - Pagination metadata
- `PaginationQuery` - Query params cho pagination

### Enums
- `PermissionModule` - Module phân quyền (USER, PRODUCT, ORDER, etc.)
- `PermissionAction` - Action phân quyền (READ, CREATE, UPDATE, DELETE, MANAGE)

## Ví dụ sử dụng

### 1. Service Methods với Return Types
```typescript
import type { AuthResponse, User } from '@shared/types';

@Injectable()
export class AuthService {
  async login(dto: LoginDto): Promise<AuthResponse> {
    // ... logic
    return {
      user: sanitizeUser(user),
      tokens: { accessToken, refreshToken }
    };
  }

  async findOne(id: string): Promise<User> {
    // ... logic
    return user;
  }
}
```

### 2. Response Interceptor
```typescript
import type { ApiResponse, PaginatedResponse } from '@shared/types';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse> {
    return next.handle().pipe(
      map((data): ApiResponse => {
        // ... transform logic
        return {
          success: true,
          statusCode: response.statusCode,
          message: 'OK',
          path: request.url,
          timestamp: new Date().toISOString(),
          data: data,
          meta: null,
        };
      }),
    );
  }
}
```

### 3. DTOs implement từ Shared Types
```typescript
import type { User } from '@shared/types';

export class UserResponseDto implements Omit<User, 'deletedAt'> {
  @Expose()
  id: string;
  
  @Expose()
  email: string;
  
  // ... other fields
}
```

### 4. Sử dụng Enums
```typescript
import { PermissionModule, PermissionAction } from '@shared/enums';

// Trong permission decorator
@Permission(`${PermissionModule.USER}.${PermissionAction.UPDATE}`)
async updateUser() {
  // ...
}
```

## Best Practices

1. **Return Types**: Luôn dùng shared types cho return types của services
2. **DTOs**: DTOs có thể implement từ shared types để đảm bảo consistency
3. **Enums**: Luôn dùng shared enums thay vì string literals
4. **Type Safety**: Sử dụng `type` import để tránh import runtime code

## Workflow

1. **Khi thêm type mới vào shared**:
   ```bash
   cd shared
   npm run build
   ```

2. **Backend sẽ tự động nhận types mới** (nếu dùng TypeScript server)

3. **Import và sử dụng**:
   ```typescript
   import type { NewType } from '@shared/types';
   ```

## Lưu ý

- ✅ Backend chỉ import từ `dist/`, không import từ `src/`
- ✅ Shared package phải được build trước khi backend compile
- ✅ DTOs vẫn dùng class-validator decorators, nhưng có thể implement từ shared types
- ✅ Return types nên dùng shared types để đảm bảo consistency với frontend

