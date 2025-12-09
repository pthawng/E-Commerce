# Pagination System

Hệ thống pagination chuẩn senior, tái sử dụng cho toàn bộ backend.

## 🎯 Tổng quan

Hệ thống pagination này cung cấp:

1. **DTO Validation** - Validate và sanitize input từ client
2. **Helper Functions** - Các hàm tiện ích cho pagination
3. **BasePaginationService** - Service tái sử dụng cho mọi module
4. **Type Safety** - TypeScript types đầy đủ
5. **Performance** - Parallel execution (count + findMany)
6. **REST Links** - HATEOAS-style pagination links

## 📦 Cấu trúc

```
pagination/
├── pagination.dto.ts       # DTO cho query params (page, limit, sort)
├── pagination.util.ts      # Helper functions (buildPagination, parseSort, etc.)
├── pagination.service.ts   # BasePaginationService - service chính
├── pagination.module.ts    # NestJS module
└── index.ts                # Exports
```

## 🚀 Cách sử dụng

### 1. Import PaginationModule

Trong module của bạn (ví dụ: `user.module.ts`):

```typescript
import { PaginationModule } from 'src/common/pagination';

@Module({
  imports: [PrismaModule, PaginationModule],
  // ...
})
export class UserModule {}
```

### 2. Inject PaginationService vào Service

```typescript
import { PaginationService, PaginationDto, type PaginatedResult } from 'src/common/pagination';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}
}
```

### 3. Sử dụng trong Service Method

```typescript
async findAllPaginated(dto: PaginationDto): Promise<PaginatedResult<User>> {
  const result = await this.paginationService.paginate<User>({
    // Prisma findMany delegate
    findMany: (args) =>
      this.prisma.user.findMany({
        ...args,
        where: { ...args.where, deletedAt: null },
      }),

    // Prisma count delegate
    count: (args) =>
      this.prisma.user.count({
        ...args,
        where: { ...args.where, deletedAt: null },
      }),

    // Pagination DTO từ query params
    dto,

    // Where clause (optional)
    where: { deletedAt: null },

    // Include relations (optional)
    // include: { roles: true },

    // Select specific fields (optional)
    // select: { id: true, email: true, fullName: true },

    // Whitelist các field được phép sort
    allowedSortFields: ['createdAt', 'email', 'fullName', 'updatedAt'],

    // Default sort (optional)
    defaultSort: { field: 'createdAt', order: 'desc' },

    // Base path cho pagination links
    basePath: '/users',

    // Extra query params để include trong links (optional)
    // extraQuery: { search: dto.search, status: dto.status },
  });

  // Transform items nếu cần (optional)
  return {
    ...result,
    items: result.items.map((u) => plainToInstance(UserResponseDto, u)),
  };
}
```

### 4. Sử dụng trong Controller

```typescript
import { Query } from '@nestjs/common';
import { PaginationDto } from 'src/common/pagination';

@Controller('users')
export class UserController {
  @Get('list')
  findAllPaginated(@Query() dto: PaginationDto) {
    return this.userService.findAllPaginated(dto);
  }
}
```

## 📝 API Request/Response

### Request

```
GET /users/list?page=1&limit=20&sort=createdAt:desc
```

**Query Parameters:**
- `page` (number, default: 1, min: 1) - Số trang
- `limit` (number, default: 20, min: 1, max: 100) - Số items mỗi trang
- `sort` (string, format: `field:direction`) - Sort field và direction (asc/desc)

**Ví dụ:**
- `?page=2&limit=10` - Trang 2, 10 items/trang
- `?sort=email:asc` - Sort theo email tăng dần
- `?page=1&limit=20&sort=createdAt:desc` - Trang 1, 20 items, sort mới nhất trước

### Response

```json
{
  "items": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 105,
    "totalPages": 6,
    "hasNext": true,
    "hasPrev": false
  },
  "links": {
    "self": "/users?page=1&limit=20",
    "next": "/users?page=2&limit=20",
    "prev": null
  }
}
```

## 🔒 Bảo mật

### Sort Whitelist

Chỉ các field trong `allowedSortFields` mới được phép sort. Điều này ngăn chặn:
- SQL Injection
- Sort trên các field không được phép
- Lỗi query do field không tồn tại

```typescript
allowedSortFields: ['createdAt', 'email', 'fullName']
// ✅ Cho phép: ?sort=email:asc
// ❌ Từ chối: ?sort=password:desc (fallback về defaultSort)
```

### Input Validation

DTO tự động validate:
- `page` phải là số nguyên >= 1
- `limit` phải là số nguyên từ 1-100
- `sort` phải match format `field:direction`

Nếu không hợp lệ → NestJS trả về 400 Bad Request ngay tại layer DTO.

## ⚡ Performance

### Parallel Execution

Service tự động chạy `count` và `findMany` song song:

```typescript
const [items, totalItems] = await Promise.all([
  findMany({ ... }),
  count({ ... }),
]);
```

→ Giảm latency ~50% so với chạy tuần tự.

### Database Indexing

Để tối ưu pagination, đảm bảo index các field thường dùng để sort:

```sql
CREATE INDEX ON "User" ("createdAt");
CREATE INDEX ON "User" ("email");
```

## 🎨 Advanced Usage

### Với Include Relations

```typescript
const result = await this.paginationService.paginate({
  findMany: (args) => this.prisma.user.findMany(args),
  count: (args) => this.prisma.user.count(args),
  dto,
  where: { deletedAt: null },
  include: {
    roles: {
      include: {
        permissions: true,
      },
    },
  },
  allowedSortFields: ['createdAt', 'email'],
  basePath: '/users',
});
```

### Với Select Specific Fields

```typescript
const result = await this.paginationService.paginate({
  findMany: (args) => this.prisma.user.findMany(args),
  count: (args) => this.prisma.user.count(args),
  dto,
  where: { deletedAt: null },
  select: {
    id: true,
    email: true,
    fullName: true,
    createdAt: true,
  },
  allowedSortFields: ['createdAt', 'email'],
  basePath: '/users',
});
```

### Với Extra Query Params

```typescript
const result = await this.paginationService.paginate({
  // ...
  basePath: '/users',
  extraQuery: {
    search: dto.search,
    status: dto.status,
    role: dto.role,
  },
});

// Links sẽ include các query params này:
// /users?page=2&limit=20&search=john&status=active
```

## 📚 Helper Functions

Nếu không dùng `PaginationService`, bạn có thể dùng các helper functions trực tiếp:

```typescript
import {
  buildPagination,
  buildPaginationMeta,
  buildPaginationLinks,
  parseSort,
} from 'src/common/pagination';

// Calculate skip/take
const { skip, take } = buildPagination({ page: 1, limit: 20 });

// Parse sort string
const { field, order } = parseSort('email:asc', ['email', 'createdAt']);

// Build meta
const meta = buildPaginationMeta({ totalItems: 100, page: 1, limit: 20 });

// Build links
const links = buildPaginationLinks({
  basePath: '/users',
  page: 1,
  limit: 20,
  totalPages: 5,
});
```

## ✅ Best Practices

1. **Luôn dùng whitelist cho sort** - Bảo mật và tránh lỗi
2. **Index các field thường sort** - Tối ưu performance
3. **Dùng parallel execution** - Service tự động xử lý
4. **Transform items sau pagination** - Giữ nguyên structure của result
5. **Include extra query params** - Giúp FE dễ dàng navigate

## 🔄 Migration từ findAll() sang findAllPaginated()

**Trước:**
```typescript
@Get()
findAll() {
  return this.userService.findAll(); // Trả về tất cả
}
```

**Sau:**
```typescript
@Get()
findAll(@Query() dto: PaginationDto) {
  return this.userService.findAllPaginated(dto); // Paginated
}

// Hoặc giữ cả 2:
@Get()
findAll() {
  return this.userService.findAll(); // Backward compatibility
}

@Get('list')
findAllPaginated(@Query() dto: PaginationDto) {
  return this.userService.findAllPaginated(dto); // New paginated endpoint
}
```

