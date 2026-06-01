# Kiến trúc Hệ thống & Mô hình Dữ liệu

Phân hệ **Kho Két & Hàng tồn kho** sử dụng cơ sở dữ liệu PostgreSQL làm kho lưu trữ chính, định nghĩa mô hình dữ liệu qua Prisma ORM và phát triển dịch vụ dựa trên framework NestJS. Thiết kế hướng tới xử lý đồng thời (concurrency) hiệu năng cao, tuân thủ kiểm toán chặt chẽ và bảo vệ tính toàn vẹn của dữ liệu.

## Kiểm soát Giao dịch Đồng thời (Concurrency Control)

Đối với trang sức độc bản cao cấp, việc xảy ra bán quá đà (overselling) hoặc hai khách hàng cùng đặt trước một sản phẩm duy nhất là lỗi nghiêm trọng. Hệ thống áp dụng giải pháp **Khóa bi quan (Pessimistic Locking)** bằng câu lệnh `SELECT ... FOR UPDATE` trong các giao dịch cơ sở dữ liệu khi thực hiện giữ chỗ (reserve) hoặc điều chỉnh số lượng tồn kho.

Quy trình giữ chỗ cho một biến thể:
1. Mở một Prisma Transaction (`prisma.$transaction`).
2. Thực hiện truy vấn khóa dòng đối với bản ghi `InventoryBalance` khớp `variantId` và `warehouseId` (sử dụng helper `lockInventoryBalance`).
3. Xác nhận tồn khả dụng: `quantity - reservedQuantity - damagedQuantity >= requested`.
4. Nếu hợp lệ, tăng `reservedQuantity` và hoàn tất giao dịch (commit). Nếu không đủ, hủy bỏ giao dịch (rollback).

Cách này đảm bảo rằng các yêu cầu đồng thời cạnh tranh cùng một tài sản sẽ phải xếp hàng đợi tuần tự, loại bỏ hoàn toàn Race Condition.

## Ràng buộc mức Cơ sở dữ liệu (Database Check Constraints)

Để đảm bảo tính chính xác của dữ liệu tồn kho ngay từ tầng vật lý, các ràng buộc Check Constraints được bổ sung trực tiếp thông qua tệp SQL Migration (do Prisma không hỗ trợ Check Constraints trong cú pháp mặc định):

```sql
-- Bảo vệ số lượng tồn kho trên bảng inventory_balances không bị âm
ALTER TABLE "inventory_balances" ADD CONSTRAINT "chk_quantity_positive" CHECK ("quantity" >= 0);
ALTER TABLE "inventory_balances" ADD CONSTRAINT "chk_reserved_positive" CHECK ("reservedQuantity" >= 0);
ALTER TABLE "inventory_balances" ADD CONSTRAINT "chk_damaged_positive" CHECK ("damagedQuantity" >= 0);

-- Số lượng giữ chỗ không được phép vượt quá tồn kho thực tế
ALTER TABLE "inventory_balances" ADD CONSTRAINT "chk_reserved_le_quantity" CHECK ("reservedQuantity" <= "quantity");

-- Địa điểm kho gửi và nhận điều chuyển phải khác nhau
ALTER TABLE "stock_transfers" ADD CONSTRAINT "chk_different_warehouses" CHECK ("fromWarehouseId" <> "toWarehouseId");
```

## Phân tách Nhật ký (Logging Separation)

Hệ thống duy trì hai mô hình nhật ký độc lập để phục vụ các mục đích khác nhau:

- **InventoryLog (Nhật ký Tồn kho):** Ghi nhận các biến động vật lý về số lượng số dư tồn kho (Nhập kho, Xuất bán, Điều chỉnh). Liên kết trực tiếp với dòng `InventoryBalance`.
- **InventoryAuditLog (Nhật ký Kiểm toán Hành vi):** Lưu vết toàn bộ hoạt động ra quyết định của con người (Duyệt/Từ chối điều chuyển, Cấu hình lại hạn mức bảo hiểm, Giải quyết chênh lệch kiểm kê). Lưu lại ảnh chụp trạng thái trước/sau khi thay đổi nhằm phục vụ công tác thanh tra.

---

## Biểu diễn Prisma Models

Dưới đây là cấu trúc các model chính trong file `prisma/schema.prisma` cho phân hệ này:

```prisma
model Warehouse {
  id             String              @id @default(uuid()) @db.Uuid
  code           String              @unique @db.VarChar(50)
  name           String              @db.VarChar(100)
  type           WarehouseType       @default(SHOWROOM)
  insuranceLimit Decimal             @default(0) @db.Decimal(19, 2)
  
  balances       InventoryBalance[]
  physicalItems  PhysicalItem[]
}

model InventoryBalance {
  id               String         @id @default(uuid()) @db.Uuid
  productVariantId String         @db.Uuid
  warehouseId       String         @db.Uuid
  quantity         Int            @default(0) // Số lượng thực tế trong kho (On-hand)
  reservedQuantity Int            @default(0) // Số lượng giữ hàng đặt trước
  damagedQuantity  Int            @default(0) // Số lượng lỗi hỏng
  inTransitQuantity Int           @default(0) // Số lượng đang vận chuyển đến

  productVariant   ProductVariant @relation(fields: [productVariantId], references: [id], onDelete: Cascade)
  warehouse        Warehouse      @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  logs             InventoryLog[]

  @@unique([productVariantId, warehouseId])
}

model PhysicalItem {
  id               String             @id @default(uuid()) @db.Uuid
  productVariantId String             @db.Uuid
  warehouseId      String             @db.Uuid
  serialNumber     String             @unique @db.VarChar(100)
  rfidTag          String?            @unique @db.VarChar(100) // Cho phép null khi chưa gắn chip
  status           PhysicalItemStatus @default(IN_VAULT)
}

model InventoryReservation {
  id               String            @id @default(uuid()) @db.Uuid
  orderId          String            @db.Uuid
  productVariantId String            @db.Uuid
  warehouseId      String            @db.Uuid
  physicalItemId   String?           @db.Uuid
  quantity         Int               @default(1)
  status           ReservationStatus @default(ACTIVE)
  expiresAt        DateTime
  idempotencyKey   String?           @unique @db.VarChar(100)
}
```
