# Product Variant Module - ABAC/RBAC Implementation

## 📋 Tổng quan

Module này implement **Hybrid RBAC/ABAC** (Role-Based + Attribute-Based Access Control) cho Product Variants, cung cấp hệ thống phân quyền linh hoạt và mạnh mẽ.

## 🎯 Các file đã cập nhật

### 1. **Permissions Constants** (`src/modules/rbac/permissions.constants.ts`)
- ✅ Thêm `PRODUCT.VARIANT` permissions:
  - `product.variant.create`
  - `product.variant.read`
  - `product.variant.update`
  - `product.variant.delete`
  - `product.variant.manage` (Full access)

### 2. **Variant Policy** (`src/modules/product/variants/variant.policy.ts`)
- ✅ Nâng cấp từ simple role-based sang hybrid RBAC/ABAC
- ✅ Implement chi tiết cho từng action (READ, CREATE, UPDATE, DELETE)
- ✅ Thêm business rules và attribute-based checks
- ✅ Support role hierarchy và permission inheritance

### 3. **Documentation** (`src/modules/product/variants/VARIANT_AUTHORIZATION.md`)
- ✅ Hướng dẫn chi tiết về permissions và roles
- ✅ Testing scenarios với ví dụ cụ thể
- ✅ Best practices và troubleshooting

### 4. **Seed Script** (`scripts/seed-variant-permissions.ts`)
- ✅ Tự động tạo permissions trong database
- ✅ Tự động gán permissions cho roles
- ✅ Idempotent (có thể chạy nhiều lần an toàn)

## 🚀 Quick Start

### Bước 1: Chạy seed script để tạo permissions

```bash
# Chạy seed script
npx ts-node scripts/seed-variant-permissions.ts
```

Script sẽ:
1. Tạo 5 permissions cho variant
2. Gán permissions cho các roles phù hợp:
   - `admin` → `product.variant.manage`
   - `product-manager` → `product.variant.manage`
   - `manager` → CREATE, READ, UPDATE, DELETE
   - `staff` → CREATE, READ, UPDATE
   - `inventory-manager` → READ, UPDATE
   - `customer` → READ

### Bước 2: Verify permissions trong database

```sql
-- Xem tất cả variant permissions
SELECT * FROM "Permission" WHERE slug LIKE 'product.variant%';

-- Xem role-permission assignments
SELECT 
  r.slug as role,
  p.slug as permission
FROM "RolePermission" rp
JOIN "Role" r ON r.id = rp."roleId"
JOIN "Permission" p ON p.id = rp."permissionId"
WHERE p.slug LIKE 'product.variant%'
ORDER BY r.slug, p.slug;
```

### Bước 3: Test API với các roles khác nhau

```bash
# Test với admin token
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:3000/products/{productId}/variants

# Test với customer token
curl -H "Authorization: Bearer <customer_token>" \
  http://localhost:3000/products/{productId}/variants
```

## 📊 Permission Matrix

| Role | CREATE | READ | UPDATE | DELETE | MANAGE |
|------|--------|------|--------|--------|--------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Product Manager | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ✅ | ❌ |
| Staff | ✅ | ✅ | ✅ | ❌ | ❌ |
| Inventory Manager | ❌ | ✅ | ✅* | ❌ | ❌ |
| Customer | ❌ | ✅** | ❌ | ❌ | ❌ |

*\* Inventory Manager chỉ nên update stock-related fields*  
*\*\* Customer chỉ xem variants có `isActive = true`*

## 🔐 Authorization Flow

```
Request → AbacGuard → VariantPolicy.evaluate()
                            ↓
                    1. Authentication check
                            ↓
                    2. Admin bypass?
                            ↓
                    3. MANAGE permission?
                            ↓
                    4. Action-specific check
                            ↓
                    5. Business rules
                            ↓
                    Allow/Deny
```

## 📝 Ví dụ sử dụng

### Controller với ABAC Guard

```typescript
@Controller('products/:productId/variants')
@UseGuards(AbacGuard)
export class VariantController {
  
  @Get()
  @CheckPolicy(VariantPolicy, PolicyAction.READ)
  findByProduct(@Param('productId') productId: string) {
    return this.variantService.findByProduct(productId);
  }

  @Post()
  @CheckPolicy(VariantPolicy, PolicyAction.CREATE, 'productId')
  create(@Param('productId') productId: string, @Body() dto: CreateVariantDto) {
    return this.variantService.createVariant(productId, dto);
  }
}
```

### Gán permission cho user

```typescript
// Gán permission lẻ cho user
await rbacService.assignPermissionToUser(
  userId,
  'product.variant.update'
);

// Gán role cho user (kèm theo tất cả permissions của role)
await rbacService.assignRoleToUser(userId, 'staff');
```

## 🧪 Testing Scenarios

### ✅ Scenario 1: Admin full access
```typescript
User: { role: 'admin' }
Action: ANY
Result: ALLOWED (bypass all checks)
```

### ✅ Scenario 2: Staff tạo variant
```typescript
User: { 
  role: 'staff', 
  permissions: ['product.variant.create'] 
}
Resource: { sku: 'VAR-001' }
Action: CREATE
Result: ALLOWED
```

### ❌ Scenario 3: Customer xem variant inactive
```typescript
User: { 
  role: 'customer', 
  permissions: ['product.variant.read'] 
}
Resource: { isActive: false }
Action: READ
Result: DENIED - "Variant này không khả dụng"
```

### ❌ Scenario 4: Staff xóa variant
```typescript
User: { 
  role: 'staff', 
  permissions: ['product.variant.delete'] 
}
Action: DELETE
Result: DENIED - "Chỉ manager mới có thể xóa variant"
```

Xem thêm scenarios trong [VARIANT_AUTHORIZATION.md](./VARIANT_AUTHORIZATION.md)

## 🔧 Troubleshooting

### Permission không hoạt động?

1. **Kiểm tra permission đã được tạo trong DB**
   ```sql
   SELECT * FROM "Permission" WHERE slug = 'product.variant.read';
   ```

2. **Kiểm tra role đã được gán permission**
   ```sql
   SELECT * FROM "RolePermission" rp
   JOIN "Role" r ON r.id = rp."roleId"
   JOIN "Permission" p ON p.id = rp."permissionId"
   WHERE r.slug = 'staff' AND p.slug = 'product.variant.read';
   ```

3. **Kiểm tra user đã được gán role**
   ```sql
   SELECT * FROM "UserRole" ur
   JOIN "User" u ON u.id = ur."userId"
   JOIN "Role" r ON r.id = ur."roleId"
   WHERE u.email = 'user@example.com';
   ```

4. **Kiểm tra JWT token có chứa roles**
   ```typescript
   // Decode JWT token và kiểm tra payload
   const decoded = jwt.decode(token);
   console.log(decoded.roles); // Should contain user's roles
   ```

5. **Kiểm tra permissions được lazy load**
   ```typescript
   // Permissions được load trong PermissionGuard hoặc Policy
   console.log(user.permissions); // Should contain user's permissions
   ```

### Policy luôn deny?

1. **Kiểm tra AbacGuard đã được thêm vào controller**
   ```typescript
   @UseGuards(AbacGuard) // ← Phải có
   export class VariantController {}
   ```

2. **Kiểm tra CheckPolicy decorator**
   ```typescript
   @CheckPolicy(VariantPolicy, PolicyAction.READ) // ← Phải có
   findByProduct() {}
   ```

3. **Kiểm tra VariantPolicy đã được register trong module**
   ```typescript
   @Module({
     providers: [VariantPolicy], // ← Phải có
   })
   export class ProductModule {}
   ```

## 📚 Tài liệu liên quan

- [VARIANT_AUTHORIZATION.md](./VARIANT_AUTHORIZATION.md) - Chi tiết về authorization
- [RBAC Module](../../rbac/README.md) - Role-Based Access Control
- [ABAC Module](../../abac/README.md) - Attribute-Based Access Control
- [Permission Constants](../../rbac/permissions.constants.ts) - Tất cả permissions

## 🎓 Best Practices

### 1. Luôn kiểm tra permissions trước roles
```typescript
// ✅ GOOD
if (!hasPermission(user, PERMISSIONS.PRODUCT.VARIANT.CREATE)) {
  return deny('Không có quyền');
}
if (!hasAnyRole(user, ['staff', 'manager'])) {
  return deny('Chỉ nhân viên');
}
```

### 2. Sử dụng MANAGE permission cho full access
```typescript
// Thay vì gán 4 permissions riêng lẻ
await rbacService.assignPermissionToRole('product-manager', 'product.variant.manage');
```

### 3. Implement business rules trong policy
```typescript
// Business logic nên ở trong policy, không phải service
if (resource.hasOrders) {
  return deny('Không thể xóa variant đã có đơn hàng');
}
```

### 4. Trả về metadata hữu ích
```typescript
return allow({ 
  metadata: { 
    warning: 'Inventory manager chỉ nên update stock fields'
  } 
});
```

## 🔄 Migration từ hệ thống cũ

Nếu bạn đang migrate từ simple role-based sang hybrid RBAC/ABAC:

1. **Chạy seed script** để tạo permissions mới
2. **Gán permissions cho roles** hiện có
3. **Update controllers** để sử dụng `@CheckPolicy` decorator
4. **Test thoroughly** với các roles khác nhau
5. **Monitor logs** để phát hiện issues

## 📈 Roadmap

- [ ] Thêm permission caching để tăng performance
- [ ] Implement field-level permissions (ví dụ: inventory-manager chỉ update stock)
- [ ] Thêm audit logging cho authorization decisions
- [ ] Support dynamic permissions based on resource state
- [ ] Implement permission groups/bundles

## 🤝 Contributing

Khi thêm features mới cho variant:

1. Thêm permissions vào `permissions.constants.ts`
2. Update `VariantPolicy` với logic mới
3. Update documentation
4. Thêm test cases
5. Update seed script nếu cần

---

**Lưu ý**: Đây là hệ thống production-ready với đầy đủ error handling, validation, và documentation. Tuy nhiên, bạn nên customize theo business requirements cụ thể của mình.
