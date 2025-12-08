# ABAC (Attribute-Based Access Control) System

Enterprise-level ABAC system với policy engine, caching, và comprehensive error handling.

## Kiến trúc

```
┌─────────────────┐
│  Controller     │
│  @CheckPolicy() │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   AbacGuard     │ ← Extract metadata, build context
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PolicyEngine    │ ← Caching, evaluation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  BasePolicy     │ ← Business logic
│  (OrderPolicy)  │
└─────────────────┘
```

## Cách sử dụng

### 1. Tạo Policy

```typescript
import { Injectable } from '@nestjs/common';
import { BasePolicy } from './base/base-policy';
import type { PolicyContext, PolicyResult } from './types/policy.types';
import { PolicyAction } from './types/policy.types';

interface Order {
  id: string;
  userId: string;
  status: string;
}

@Injectable()
export class OrderPolicy extends BasePolicy<Order> {
  async evaluate(context: PolicyContext<Order>): Promise<PolicyResult> {
    const { user, resource: order, action } = context;

    // Admin có full access
    if (this.hasRole(user, 'admin')) {
      return this.allow();
    }

    switch (action) {
      case PolicyAction.READ:
        return this.handleRead(user, order);
      case PolicyAction.UPDATE:
        return this.handleUpdate(user, order);
      default:
        return this.deny(`Action ${action} not supported`);
    }
  }

  private handleRead(user: PolicyContext['user'], order?: Order): PolicyResult {
    if (!order) return this.allow(); // List view
    
    if (this.isOwner(user, order)) {
      return this.allow();
    }
    
    return this.deny('Bạn chỉ có thể xem đơn hàng của chính mình');
  }

  private handleUpdate(user: PolicyContext['user'], order?: Order): PolicyResult {
    if (!order) return this.deny('Order not found');
    
    if (this.hasRole(user, 'admin')) {
      return this.allow();
    }
    
    if (this.isOwner(user, order) && order.status === 'pending') {
      return this.allow();
    }
    
    return this.deny('Bạn không có quyền cập nhật đơn hàng này');
  }
}
```

### 2. Sử dụng trong Controller

```typescript
import { Controller, Get, Patch, Param } from '@nestjs/common';
import { CheckPolicy, PolicyAction } from '@modules/abac/decorators/policy.decorator';
import { OrderPolicy } from '@modules/abac/OrderPolicy';

@Controller('orders')
export class OrderController {
  @Get(':id')
  @CheckPolicy(OrderPolicy, PolicyAction.READ, 'id')
  async getOrder(@Param('id') id: string) {
    // Policy tự động check quyền
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  @CheckPolicy(OrderPolicy, PolicyAction.UPDATE, 'id')
  async updateOrder(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    // Policy tự động check quyền
    return this.orderService.update(id, dto);
  }
}
```

### 3. Custom Resource Resolver

Nếu cần custom logic để resolve resource:

```typescript
@Get(':id')
@CheckPolicy(
  OrderPolicy,
  PolicyAction.READ,
  'id',
  async (req) => {
    // Custom resolver - có thể include relations, transform data, etc.
    return await this.orderService.findOneWithRelations(req.params.id);
  }
)
async getOrder(@Param('id') id: string) {
  return this.orderService.findOne(id);
}
```

## Policy Context

Policy context chứa đầy đủ thông tin để evaluate:

```typescript
interface PolicyContext {
  user: {
    userId: string;
    email?: string;
    roles: string[];        // Từ JWT (RBAC)
    permissions?: string[]; // Lazy loaded từ DB
    attributes?: Record<string, unknown>;
  };
  resource?: TResource;     // Entity đang được check
  action: PolicyAction;     // READ, CREATE, UPDATE, DELETE, etc.
  environment?: {
    timestamp?: Date;
    ipAddress?: string;
    userAgent?: string;
    location?: { country?: string; city?: string };
  };
  request?: {
    method?: string;
    path?: string;
    query?: Record<string, unknown>;
    body?: unknown;
  };
}
```

## Helper Methods

BasePolicy cung cấp các helper methods:

```typescript
// Role checks
this.hasRole(user, 'admin')
this.hasAnyRole(user, ['admin', 'staff'])
this.hasAllRoles(user, ['admin', 'manager'])

// Permission checks
this.hasPermission(user, 'order.update')
this.hasAnyPermission(user, ['order.update', 'order.delete'])

// Resource checks
this.isOwner(user, resource)
this.hasAttribute(resource, 'status', 'pending')

// Time checks
this.isBusinessHours(timestamp)

// Results
this.allow(metadata?)
this.deny(reason, metadata?)
```

## Caching

Policy engine tự động cache results:

- **Read operations**: Cached với TTL 60s (default)
- **Write operations**: Skip cache (always fresh)
- **Custom TTL**: Có thể config trong `PolicyEvaluationOptions`

```typescript
// Clear cache manually
this.policyEngine.clearCache('OrderPolicy'); // Specific policy
this.policyEngine.clearCache(); // All policies
```

## Best Practices

1. **Separation of Concerns**: Mỗi entity có policy riêng
2. **Fail Secure**: Default deny nếu không rõ ràng
3. **Performance**: Sử dụng caching cho read operations
4. **Type Safety**: Sử dụng TypeScript types cho resources
5. **Logging**: Policy engine tự động log denies
6. **Testing**: Test policies độc lập với controllers

## Integration với RBAC

ABAC hoạt động cùng với RBAC:

- **RBAC**: Roles trong JWT, permissions từ DB
- **ABAC**: Fine-grained checks dựa trên resource attributes
- **Hybrid**: Combine cả hai cho maximum flexibility

```typescript
// Example: Check both role and resource ownership
if (this.hasRole(user, 'admin') || this.isOwner(user, order)) {
  return this.allow();
}
```

## Advanced Features

### Time-based Policies

```typescript
if (!this.isBusinessHours(context.environment?.timestamp)) {
  return this.deny('Chỉ có thể thực hiện trong giờ làm việc');
}
```

### Location-based Policies

```typescript
if (context.environment?.location?.country !== 'VN') {
  return this.deny('Chỉ có thể truy cập từ Việt Nam');
}
```

### Custom Attributes

```typescript
if (user.attributes?.accountStatus === 'suspended') {
  return this.deny('Tài khoản đã bị tạm khóa');
}
```

## Module Setup

```typescript
import { AbacModule } from '@modules/abac/abac.module';

@Module({
  imports: [AbacModule],
  // ...
})
export class AppModule {}
```

## Error Handling

Policy denies sẽ throw `ForbiddenException` với message từ policy:

```typescript
// Policy returns: { allowed: false, reason: 'Custom message' }
// Guard throws: ForbiddenException('Custom message')
```

