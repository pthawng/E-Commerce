# Database Migration — Ray Paradis

> Hướng dẫn thực hiện Prisma migrations đúng cách. Sai sót ở bước này có thể gây mất dữ liệu hoặc downtime production.

---

## 1. Workflow Migration

```
1. Chỉnh sửa prisma/schema.prisma
      ↓
2. npx prisma migrate dev --name [tên_migration]
      ↓
3. Kiểm tra file SQL được generate trong prisma/migrations/
      ↓
4. Thêm Check Constraints thủ công nếu cần (xem mục 3)
      ↓
5. Chạy test để xác nhận schema mới không break existing code
      ↓
6. Commit cả schema.prisma VÀ thư mục migrations/ trong cùng một commit
```

---

## 2. Lệnh Prisma Thường Dùng

```bash
# Tạo migration mới từ thay đổi schema (development)
npx prisma migrate dev --name add_physical_item_rfid_tag

# Áp dụng migrations đang pending (CI/CD, production)
npx prisma migrate deploy

# Reset database về trạng thái ban đầu + chạy lại toàn bộ migrations (DEV ONLY)
npx prisma migrate reset

# Kiểm tra trạng thái migrations
npx prisma migrate status

# Mở Prisma Studio để xem data (DEV ONLY)
npx prisma studio

# Generate Prisma Client sau khi thay đổi schema
npx prisma generate

# Seed dữ liệu mẫu
npx prisma db seed
```

---

## 3. Check Constraints — Workaround Prisma

**Prisma không hỗ trợ `CHECK CONSTRAINTS` trong cú pháp schema mặc định.** Cần thêm thủ công vào migration SQL.

### Cách thực hiện:

```bash
# 1. Tạo empty migration
npx prisma migrate dev --name add_inventory_check_constraints --create-only

# 2. Mở file SQL được tạo trong prisma/migrations/[timestamp]_add_inventory_check_constraints/migration.sql
# 3. Thêm nội dung SQL thủ công
# 4. Chạy migration
npx prisma migrate dev
```

### Ví dụ Check Constraints cho inventory_balances:

```sql
-- File: prisma/migrations/[timestamp]_add_inventory_check_constraints/migration.sql

-- Bảo vệ số lượng tồn kho không âm
ALTER TABLE "inventory_balances" ADD CONSTRAINT "chk_quantity_positive"
  CHECK ("quantity" >= 0);

ALTER TABLE "inventory_balances" ADD CONSTRAINT "chk_reserved_positive"
  CHECK ("reservedQuantity" >= 0);

ALTER TABLE "inventory_balances" ADD CONSTRAINT "chk_damaged_positive"
  CHECK ("damagedQuantity" >= 0);

-- Số lượng giữ chỗ không vượt tồn kho thực tế
ALTER TABLE "inventory_balances" ADD CONSTRAINT "chk_reserved_le_quantity"
  CHECK ("reservedQuantity" <= "quantity");

-- Kho gửi và nhận phải khác nhau
ALTER TABLE "stock_transfers" ADD CONSTRAINT "chk_different_warehouses"
  CHECK ("fromWarehouseId" <> "toWarehouseId");
```

---

## 4. Naming Convention cho Migrations

Format: `[action]_[entity]_[detail]`

```bash
# ✅ Tốt — rõ ràng, dễ trace history
add_physical_item_rfid_tag
add_inventory_check_constraints
rename_warehouse_type_enum
add_payment_idempotency_key_index
remove_deprecated_product_slug_column

# ❌ Tệ
update_schema
fix_bug
migration1
new_changes
```

---

## 5. Quy tắc Quan trọng

### ❌ KHÔNG BAO GIỜ

```bash
# Không chỉnh sửa file migration đã được commit và deploy
# Nếu có lỗi → tạo migration mới để fix, không edit migration cũ
```

### ✅ Luôn phải

1. **Commit migration cùng code**: Schema + migration file phải nằm trong cùng một commit với code sử dụng schema đó
2. **Test migration trên local trước**: Chạy `migrate reset` trên local, đảm bảo toàn bộ migration chạy sạch từ đầu
3. **Backward compatible khi có thể**: Nếu rename column, tạo column mới trước, migrate data, rồi xóa column cũ trong migration tiếp theo (zero downtime deploy)

### ⚠️ Cẩn thận với

```sql
-- Xóa column có data → cần backup trước
ALTER TABLE "products" DROP COLUMN "legacyCode";

-- Thay đổi kiểu dữ liệu → kiểm tra conversion có an toàn không
ALTER TABLE "products" ALTER COLUMN "price" TYPE DECIMAL(19,4);

-- Thêm NOT NULL constraint vào column đã có data → cần default hoặc update data trước
ALTER TABLE "orders" ALTER COLUMN "trackingNumber" SET NOT NULL;
```

---

## 6. Migration trong CI/CD

```yaml
# .github/workflows/deploy.yml
- name: Run database migrations
  run: |
    cd backend
    npx prisma migrate deploy  # Chỉ dùng 'deploy', KHÔNG dùng 'dev' trong CI
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Lý do dùng `migrate deploy` thay `migrate dev` trong CI:**
- `migrate dev` có thể reset database nếu drift detected
- `migrate deploy` chỉ apply pending migrations, an toàn cho production

---

## 7. Troubleshooting

### Lỗi "Drift detected"

```bash
# Khi schema.prisma và database thực tế không đồng bộ
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource datasource db

# Nếu an toàn để reset (DEV ONLY):
npx prisma migrate reset
```

### Migration bị stuck (production)

```sql
-- Kiểm tra migration nào đang pending
SELECT * FROM "_prisma_migrations" WHERE finished_at IS NULL;

-- Nếu migration lỗi và cần rollback thủ công:
-- 1. Fix schema hoặc data issue
-- 2. Mark migration as failed: UPDATE "_prisma_migrations" SET rolled_back_at = NOW() WHERE id = '[id]';
-- 3. Tạo fix migration mới
```
