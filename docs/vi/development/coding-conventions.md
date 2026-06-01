# Coding Conventions — Ray Paradis

> Tài liệu này định nghĩa các quy ước code áp dụng thống nhất trong toàn bộ monorepo. Mục tiêu: codebase có thể đọc hiểu bởi bất kỳ ai trong team mà không cần hỏi tác giả.

---

## 1. Cấu trúc Module NestJS

Mỗi module nghiệp vụ tuân theo cấu trúc thư mục chuẩn:

```
modules/[module-name]/
├── [module].module.ts          ← @Module() declaration
├── [module].service.ts         ← Business logic chính (nếu không quá lớn)
├── [module].controller.ts      ← HTTP handler dành cho storefront/public API
├── admin-[module].controller.ts ← HTTP handler dành cho back-office
├── controllers/                ← Tách controller khi có nhiều nhóm endpoint
├── services/                   ← Tách service khi logic quá lớn
├── dto/                        ← Data Transfer Objects (Zod + class-validator)
├── enums/                      ← TypeScript enums dùng trong module
├── jobs/                       ← BullMQ job processors
├── utils/                      ← Pure utility functions (không inject service)
└── __tests__/                  ← Unit và integration tests
```

**Quy tắc bắt buộc:**
- **Controller chỉ làm**: validate input (DTO), gọi service, trả response. Không có business logic.
- **Service chứa**: business logic, transaction management, Prisma calls.
- **Không import Service của module khác trực tiếp**: giao tiếp qua Domain Events hoặc shared interfaces.

---

## 2. Naming Conventions

### Files
```
# ✅ Đúng
user.service.ts
create-user.dto.ts
rbac.guard.ts
inventory-balance.type.ts

# ❌ Sai
UserService.ts           ← PascalCase cho file
userService.ts           ← camelCase cho file
user_service.ts          ← underscore
```

### Classes & Interfaces
```typescript
// ✅ Classes: PascalCase
class InventoryService {}
class CreateProductDto {}

// ✅ Interfaces: PascalCase, không prefix 'I'
interface StockTransferPayload {}     // ✅
interface IStockTransferPayload {}    // ❌ prefix I không dùng

// ✅ Enums: PascalCase, values SCREAMING_SNAKE_CASE
enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
}
```

### Variables & Functions
```typescript
// ✅ camelCase cho variables và functions
const reservedQuantity = 0;
async function createStockTransfer() {}

// ✅ SCREAMING_SNAKE_CASE cho constants
const MAX_RETRY_ATTEMPTS = 5;
const REDIS_PERMISSION_CACHE_TTL = 3600;

// ✅ Boolean variables bắt đầu bằng is/has/can/should
const isAvailable = true;
const hasPermission = false;
```

---

## 3. DTO & Validation Pattern

Tất cả input đều phải validate qua DTO. Dùng `class-validator` decorators:

```typescript
// create-product.dto.ts
import { IsString, IsNotEmpty, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Tên sản phẩm', example: 'Nhẫn Kim Cương Solitaire' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Giá bán (VND)', example: 15000000 })
  @IsPositive()
  price: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
```

**Quy tắc:**
- Luôn thêm `@ApiProperty()` cho Swagger tự động generate
- DTO chỉ dùng `class-validator` decorators, không logic phức tạp
- Response không cần DTO — dùng Prisma select để shape response trực tiếp

---

## 4. Error Handling

Dùng NestJS built-in exceptions, không tự throw `Error`:

```typescript
// ✅ Đúng
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';

if (!product) throw new NotFoundException(`Product ${id} not found`);
if (alreadyExists) throw new ConflictException('Product with this SKU already exists');
if (!hasPermission) throw new ForbiddenException('Insufficient permissions');

// ❌ Sai — không tự throw Error vì mất HTTP status code
throw new Error('Something went wrong');
```

**Error message format**: Viết bằng tiếng Anh, đủ thông tin để debug:
```typescript
// ✅ Đủ context
throw new NotFoundException(`InventoryBalance for variant=${variantId} at warehouse=${warehouseId} not found`);

// ❌ Thiếu context
throw new NotFoundException('Balance not found');
```

---

## 5. Prisma Usage Rules

```typescript
// ✅ Luôn dùng select để chỉ lấy field cần thiết
const product = await this.prisma.product.findUnique({
  where: { id },
  select: { id: true, name: true, price: true },
});

// ❌ Tránh findUnique không có select — trả về toàn bộ field bao gồm sensitive data
const product = await this.prisma.product.findUnique({ where: { id } });

// ✅ Transaction cho multi-table operations
await this.prisma.$transaction(async (tx) => {
  await tx.order.update({ ... });
  await tx.inventoryBalance.update({ ... });
});

// ✅ Tên biến Prisma transaction luôn là 'tx'
async function doSomething(tx: Prisma.TransactionClient) { ... }
```

---

## 6. TypeScript Rules

```typescript
// ✅ Không dùng 'any' — dùng 'unknown' nếu type thực sự không biết
function parseWebhookPayload(raw: unknown): PaymentPayload { ... }

// ✅ Dùng 'as const' cho object literals dùng làm enum-like
const PAYMENT_METHODS = { VNPAY: 'VNPAY', PAYPAL: 'PAYPAL' } as const;
type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

// ✅ Return type explicit cho public methods của Service
async createOrder(dto: CreateOrderDto): Promise<Order> { ... }

// ✅ Null checks: dùng optional chaining và nullish coalescing
const name = user?.profile?.displayName ?? user.email;
```

---

## 7. Import Order

ESLint enforce thứ tự import sau (tự động format với Prettier):

```typescript
// 1. Node.js built-ins
import { randomUUID } from 'crypto';

// 2. External packages
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

// 3. Internal absolute paths (src/...)
import { PrismaService } from 'src/prisma/prisma.service';
import { PERMISSIONS } from 'src/modules/rbac/permissions.constants';

// 4. Relative imports
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './enums/order-status.enum';
```

---

## 8. Comments & Documentation

```typescript
// ✅ Comment giải thích "tại sao", không giải thích "cái gì"
// NOWAIT prevents transaction from hanging if the row is locked by another session.
// The caller is responsible for retrying with exponential backoff.
const balance = await lockInventoryBalance(tx, variantId, warehouseId);

// ❌ Comment thừa — code đã tự giải thích
// Increment reserved quantity by the requested amount
await tx.inventoryBalance.update({
  data: { reservedQuantity: { increment: quantity } }
});

// ✅ JSDoc cho public service methods
/**
 * Reserve inventory for an order item.
 * Uses pessimistic locking to prevent overselling.
 * @throws ConflictException if insufficient stock
 * @throws NotFoundException if balance record does not exist
 */
async reserveStock(variantId: string, warehouseId: string, quantity: number): Promise<void> { ... }
```
