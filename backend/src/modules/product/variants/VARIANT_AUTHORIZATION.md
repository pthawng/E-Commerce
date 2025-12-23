# Product Variant Authorization (ABAC/RBAC)

## Tổng quan

Product Variant sử dụng **Hybrid RBAC/ABAC** approach để quản lý phân quyền:

- **RBAC (Role-Based Access Control)**: Phân quyền dựa trên vai trò (role) và quyền hạn (permission)
- **ABAC (Attribute-Based Access Control)**: Phân quyền dựa trên thuộc tính của user, resource, và environment

## Permissions

Tất cả permissions cho variant được định nghĩa trong `src/modules/rbac/permissions.constants.ts`:

```typescript
PRODUCT: {
  VARIANT: {
    CREATE: 'product.variant.create',
    READ: 'product.variant.read',
    UPDATE: 'product.variant.update',
    DELETE: 'product.variant.delete',
    MANAGE: 'product.variant.manage', // Full quyền quản lý variant
  }
}
```

### Permission Hierarchy

- `product.variant.manage` - **Full access**: Bao gồm tất cả các quyền CREATE, READ, UPDATE, DELETE
- `product.variant.create` - Tạo variant mới
- `product.variant.read` - Xem thông tin variant
- `product.variant.update` - Cập nhật variant
- `product.variant.delete` - Xóa variant

## Roles và Quyền hạn

### 1. Admin
- **Full access** - Bypass tất cả policy checks
- Có thể thực hiện mọi action trên variant

### 2. Manager / Product Manager
- Có thể: CREATE, READ, UPDATE, DELETE variants
- Yêu cầu: Phải có permission tương ứng
- Business rules: Tuân thủ các quy tắc nghiệp vụ (ví dụ: không xóa variant có orders)

### 3. Staff
- Có thể: CREATE, READ, UPDATE variants
- Không thể: DELETE variants (chỉ manager mới được)
- Yêu cầu: Phải có permission tương ứng

### 4. Inventory Manager
- Có thể: READ, UPDATE variants
- Giới hạn: Chỉ nên cập nhật stock-related fields (stock, isActive)
- Yêu cầu: Phải có permission `product.variant.update`

### 5. Customer
- Có thể: READ variants (chỉ variants đang active)
- Không thể: CREATE, UPDATE, DELETE
- Business rule: Chỉ xem được variants có `isActive = true`

### 6. Guest (Unauthenticated)
- Không có quyền truy cập

## Policy Rules (VariantPolicy)

### Authentication
```typescript
if (!user || !user.userId) {
  return deny('Unauthenticated - Vui lòng đăng nhập');
}
```

### Admin Bypass
```typescript
if (hasRole(user, 'admin')) {
  return allow({ bypassReason: 'Admin full access' });
}
```

### MANAGE Permission Bypass
```typescript
if (hasPermission(user, PERMISSIONS.PRODUCT.VARIANT.MANAGE)) {
  return allow({ bypassReason: 'Has MANAGE permission' });
}
```

### READ Rules
1. **Permission check**: Phải có `product.variant.read`
2. **Customer restriction**: Customer chỉ xem variants có `isActive = true`
3. **Staff/Manager**: Xem tất cả variants

### CREATE Rules
1. **Permission check**: Phải có `product.variant.create`
2. **Role check**: Phải là `staff`, `manager`, hoặc `product-manager`
3. **Business rule**: SKU là bắt buộc

### UPDATE Rules
1. **Permission check**: Phải có `product.variant.update`
2. **Role check**: Phải là `staff`, `manager`, `product-manager`, hoặc `inventory-manager`
3. **Special case**: Inventory manager chỉ nên update stock-related fields

### DELETE Rules
1. **Permission check**: Phải có `product.variant.delete`
2. **Role check**: Phải là `manager` hoặc `product-manager`
3. **Business rule** (có thể thêm): Không xóa variant đã có orders

## Cách sử dụng

### 1. Controller Setup

```typescript
import { AbacGuard } from 'src/modules/abac/guard/abac.guard';
import { CheckPolicy } from 'src/modules/abac/decorators/policy.decorator';
import { VariantPolicy } from './variant.policy';
import { PolicyAction } from 'src/modules/abac/types/policy.types';

@Controller('products/:productId/variants')
@UseGuards(AbacGuard)
export class VariantController {
  
  @Get()
  @CheckPolicy(VariantPolicy, PolicyAction.READ)
  findByProduct(@Param('productId') productId: string) {
    // ...
  }

  @Post()
  @CheckPolicy(VariantPolicy, PolicyAction.CREATE, 'productId')
  create(@Param('productId') productId: string, @Body() dto: CreateVariantDto) {
    // ...
  }

  @Patch(':variantId')
  @CheckPolicy(VariantPolicy, PolicyAction.UPDATE, 'variantId')
  update(@Param('variantId') variantId: string, @Body() dto: UpdateVariantDto) {
    // ...
  }

  @Delete(':variantId')
  @CheckPolicy(VariantPolicy, PolicyAction.DELETE, 'variantId')
  remove(@Param('variantId') variantId: string) {
    // ...
  }
}
```

### 2. Gán Permission cho Role

```typescript
// Ví dụ: Gán quyền CREATE variant cho role "staff"
await rbacService.assignPermissionToRole(
  'staff',
  'product.variant.create'
);

// Gán full quyền MANAGE cho role "product-manager"
await rbacService.assignPermissionToRole(
  'product-manager',
  'product.variant.manage'
);
```

### 3. Gán Permission cho User

```typescript
// Gán quyền lẻ cho user cụ thể
await rbacService.assignPermissionToUser(
  userId,
  'product.variant.update'
);
```

## Testing Scenarios

### Scenario 1: Customer xem variant active
```
User: { role: 'customer', permissions: ['product.variant.read'] }
Resource: { id: '123', isActive: true }
Action: READ
Result: ✅ ALLOWED
```

### Scenario 2: Customer xem variant inactive
```
User: { role: 'customer', permissions: ['product.variant.read'] }
Resource: { id: '123', isActive: false }
Action: READ
Result: ❌ DENIED - "Variant này không khả dụng"
```

### Scenario 3: Staff tạo variant
```
User: { role: 'staff', permissions: ['product.variant.create'] }
Resource: { sku: 'VAR-001' }
Action: CREATE
Result: ✅ ALLOWED
```

### Scenario 4: Staff tạo variant không có SKU
```
User: { role: 'staff', permissions: ['product.variant.create'] }
Resource: { sku: null }
Action: CREATE
Result: ❌ DENIED - "SKU là bắt buộc khi tạo variant"
```

### Scenario 5: Inventory Manager cập nhật stock
```
User: { role: 'inventory-manager', permissions: ['product.variant.update'] }
Resource: { id: '123', stock: 100 }
Action: UPDATE
Result: ✅ ALLOWED (with warning metadata)
Metadata: {
  restrictedFields: ['stock', 'isActive'],
  warning: 'Inventory manager chỉ nên cập nhật stock-related fields'
}
```

### Scenario 6: Staff xóa variant
```
User: { role: 'staff', permissions: ['product.variant.delete'] }
Resource: { id: '123' }
Action: DELETE
Result: ❌ DENIED - "Chỉ manager mới có thể xóa variant"
```

### Scenario 7: Manager xóa variant
```
User: { role: 'manager', permissions: ['product.variant.delete'] }
Resource: { id: '123' }
Action: DELETE
Result: ✅ ALLOWED
```

### Scenario 8: Admin bypass
```
User: { role: 'admin' }
Resource: any
Action: any
Result: ✅ ALLOWED (bypass all checks)
```

## Best Practices

### 1. Luôn kiểm tra permissions trước khi kiểm tra roles
```typescript
// ✅ GOOD
if (!hasPermission(user, PERMISSIONS.PRODUCT.VARIANT.CREATE)) {
  return deny('Không có quyền tạo variant');
}
if (!hasAnyRole(user, ['staff', 'manager'])) {
  return deny('Chỉ nhân viên mới có thể tạo variant');
}

// ❌ BAD - Kiểm tra role trước
if (!hasAnyRole(user, ['staff', 'manager'])) {
  return deny('Chỉ nhân viên mới có thể tạo variant');
}
```

### 2. Sử dụng MANAGE permission cho full access
```typescript
// Gán MANAGE permission thay vì gán từng permission riêng lẻ
await rbacService.assignPermissionToRole(
  'product-manager',
  'product.variant.manage'
);
```

### 3. Implement business rules trong policy
```typescript
// Kiểm tra business rules trong policy, không phải trong service
if (resource && resource.hasOrders) {
  return deny('Không thể xóa variant đã có đơn hàng');
}
```

### 4. Trả về metadata hữu ích
```typescript
// Trả về metadata để frontend có thể hiển thị thông tin
return allow({ 
  metadata: { 
    restrictedFields: ['stock', 'isActive'],
    warning: 'Inventory manager chỉ nên cập nhật stock-related fields'
  } 
});
```

## Mở rộng

### Thêm custom action
```typescript
// 1. Thêm vào PolicyAction enum
export enum PolicyAction {
  // ... existing actions
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
}

// 2. Thêm permission
VARIANT: {
  // ... existing permissions
  ACTIVATE: 'product.variant.activate',
}

// 3. Thêm vào policy
case PolicyAction.ACTIVATE:
  return this.evaluateActivate(user, resource);
```

### Thêm environment-based rules
```typescript
// Kiểm tra business hours
if (action === PolicyAction.DELETE && !this.isBusinessHours()) {
  return deny('Chỉ được xóa variant trong giờ làm việc');
}

// Kiểm tra IP whitelist
if (context.environment?.ipAddress && !isWhitelisted(context.environment.ipAddress)) {
  return deny('IP không được phép');
}
```

### Thêm resource-based rules
```typescript
// Kiểm tra trạng thái variant
if (resource.status === 'archived') {
  return deny('Không thể cập nhật variant đã archive');
}

// Kiểm tra ownership
if (resource.createdBy === user.userId) {
  return allow({ metadata: { isOwner: true } });
}
```

## Troubleshooting

### Lỗi: "Không có quyền xem variant"
- Kiểm tra user có permission `product.variant.read`
- Kiểm tra user có role phù hợp
- Nếu là customer, kiểm tra variant có `isActive = true`

### Lỗi: "Chỉ nhân viên mới có thể tạo variant"
- Kiểm tra user có role: `staff`, `manager`, hoặc `product-manager`
- Kiểm tra user có permission `product.variant.create`

### Lỗi: "Chỉ manager mới có thể xóa variant"
- Kiểm tra user có role: `manager` hoặc `product-manager`
- Kiểm tra user có permission `product.variant.delete`

### Policy không hoạt động
- Kiểm tra `@UseGuards(AbacGuard)` đã được thêm vào controller
- Kiểm tra `@CheckPolicy(VariantPolicy, PolicyAction.XXX)` đã được thêm vào route
- Kiểm tra VariantPolicy đã được inject vào AbacModule

## References

- [RBAC Module](../../rbac/README.md)
- [ABAC Module](../../abac/README.md)
- [Permission Constants](../../rbac/permissions.constants.ts)
- [Base Policy](../../abac/base/base-policy.ts)
- [Policy Types](../../abac/types/policy.types.ts)
