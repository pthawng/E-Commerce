# Testing Strategy — Ray Paradis

> Testing trong Ray Paradis theo nguyên tắc **Test Pyramid**: nhiều unit tests, ít integration tests, một số E2E tests cho critical paths. Không đặt mục tiêu coverage số học — đặt mục tiêu bảo vệ được các business-critical flows.

---

## 1. Phân tầng Tests

```
         ┌──────────────┐
         │   E2E Tests  │  ← Ít nhất, chạy chậm nhất
         │  (Playwright)│     Critical user journeys
         ├──────────────┤
         │  Integration │  ← Trung bình
         │    Tests     │     Service ↔ Database thực
         ├──────────────┤
         │  Unit Tests  │  ← Nhiều nhất, chạy nhanh nhất
         │    (Jest)    │     Logic thuần túy, mocked dependencies
         └──────────────┘
```

---

## 2. Unit Tests

**Vị trí**: `backend/src/modules/[module]/__tests__/[name].spec.ts`

**Nguyên tắc:**
- Mock tất cả external dependencies (`PrismaService`, Redis, external APIs)
- Test một function tại một thời điểm
- Test cả happy path VÀ các error cases

### Pattern Mock PrismaService

```typescript
// __tests__/inventory.service.spec.ts
import { Test } from '@nestjs/testing';
import { InventoryService } from '../inventory.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrismaService = {
  inventoryBalance: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn((fn) => fn(mockPrismaService)), // Pass mock as tx
};

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get(InventoryService);
    jest.clearAllMocks(); // ← Quan trọng: reset giữa các test
  });

  describe('reserveStock', () => {
    it('should throw ConflictException when insufficient stock', async () => {
      mockPrismaService.inventoryBalance.findUnique.mockResolvedValue({
        id: 'uuid',
        quantity: 5,
        reservedQuantity: 5, // No available stock
        damagedQuantity: 0,
      });

      await expect(
        service.reserveStock('variant-id', 'warehouse-id', 1)
      ).rejects.toThrow(ConflictException);
    });

    it('should increment reservedQuantity on success', async () => {
      mockPrismaService.inventoryBalance.findUnique.mockResolvedValue({
        id: 'uuid',
        quantity: 10,
        reservedQuantity: 0,
        damagedQuantity: 0,
      });
      mockPrismaService.inventoryBalance.update.mockResolvedValue({});

      await service.reserveStock('variant-id', 'warehouse-id', 3);

      expect(mockPrismaService.inventoryBalance.update).toHaveBeenCalledWith({
        where: { id: 'uuid' },
        data: { reservedQuantity: { increment: 3 } },
      });
    });
  });
});
```

---

## 3. Integration Tests

**Vị trí**: `backend/src/modules/[module]/__tests__/[name].integration.spec.ts`

**Nguyên tắc:**
- Kết nối database **thực** (test database riêng, không phải production)
- Test full flow từ service method → Prisma → Database
- Seed data cần thiết trong `beforeEach`, cleanup trong `afterEach`

### Setup Test Database

```typescript
// jest.integration.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.integration.spec.ts'],
  globalSetup: './test/setup-test-db.ts',   // Migrate test DB
  globalTeardown: './test/teardown-test-db.ts',
};
```

```typescript
// __tests__/order.integration.spec.ts
describe('OrderService Integration', () => {
  let prisma: PrismaService;
  let service: OrderService;

  beforeEach(async () => {
    // Seed dữ liệu cần thiết
    await prisma.product.create({ data: testProductFixture });
    await prisma.inventoryBalance.create({ data: testBalanceFixture });
  });

  afterEach(async () => {
    // Cleanup để test sau không bị ảnh hưởng
    await prisma.order.deleteMany({ where: { /* test data */ } });
  });

  it('should create order and lock inventory atomically', async () => {
    const order = await service.createOrder(testCreateOrderDto);
    
    const balance = await prisma.inventoryBalance.findUnique({ ... });
    expect(balance.reservedQuantity).toBe(testCreateOrderDto.quantity);
  });
});
```

---

## 4. E2E Tests

**Vị trí**: `storefront/tests/` (Playwright)

**Chỉ viết E2E cho critical user journeys:**

| Journey | Priority |
|---------|----------|
| Checkout hoàn chỉnh (add to cart → payment → confirmation) | 🔴 Bắt buộc |
| Login / Logout storefront | 🔴 Bắt buộc |
| Tìm kiếm sản phẩm | 🟡 Nên có |
| Admin login back-office | 🟡 Nên có |

```typescript
// storefront/tests/checkout.spec.ts
import { test, expect } from '@playwright/test';

test('complete checkout flow', async ({ page }) => {
  await page.goto('/products/nhan-kim-cuong-solitaire');
  await page.click('[data-testid="add-to-cart"]');
  await page.click('[data-testid="checkout-btn"]');
  
  // Fill shipping info
  await page.fill('[name="fullName"]', 'Nguyễn Văn A');
  await page.fill('[name="phone"]', '0901234567');
  
  // Payment
  await page.click('[data-testid="pay-vnpay"]');
  
  await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
});
```

---

## 5. Test Naming Convention

```typescript
describe('[ClassName hoặc tên module]', () => {
  describe('[method name hoặc feature]', () => {
    it('should [kết quả mong đợi] when [điều kiện]', () => { ... });
    it('should throw [ErrorType] when [điều kiện lỗi]', () => { ... });
  });
});

// ✅ Ví dụ tốt
it('should throw ConflictException when reserved quantity exceeds available stock');
it('should return cached permissions when Redis hit');
it('should invalidate cache after role assignment');

// ❌ Ví dụ tệ
it('works correctly');
it('test reserve stock');
```

---

## 6. Chạy Tests

```bash
# Unit tests (fast, chạy thường xuyên)
cd backend
npm run test

# Unit tests watch mode (khi đang develop)
npm run test:watch

# Integration tests (chạy trước PR)
npm run test:integration

# Coverage report
npm run test:cov

# E2E tests
cd storefront
npx playwright test

# E2E tests với UI (debug)
npx playwright test --ui
```

---

## 7. Những gì KHÔNG cần test

- **Prisma model definitions** — không có logic
- **DTO class definitions** — class-validator tự test
- **NestJS module wiring** — framework đã đảm bảo
- **Getter/setter thuần** — không có business logic

**Tập trung test:**
- Service methods có conditional logic
- Guard logic (RBAC, ABAC)
- Transaction và locking logic
- Webhook idempotency
- Edge cases: empty data, null values, concurrent requests
