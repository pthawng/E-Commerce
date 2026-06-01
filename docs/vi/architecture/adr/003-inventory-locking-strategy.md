# ADR-003: Chiến lược Khóa Tồn kho — Pessimistic Locking với NOWAIT

**Trạng thái**: `Accepted`
**Ngày**: 2025-01-01
**Tác giả**: Ray Paradis Engineering

---

## Bối cảnh

Ray Paradis kinh doanh trang sức cao cấp với đặc điểm:
- Nhiều sản phẩm là **độc bản** (serialized asset) — mỗi chiếc chỉ có đúng 1 cái
- Thời điểm flash sale hoặc sự kiện ra mắt, nhiều khách hàng đặt hàng cùng lúc
- **Overselling** (bán vượt tồn kho) là lỗi nghiêm trọng về uy tín và nghiệp vụ

Cần cơ chế đảm bảo tính nhất quán tồn kho dưới tải cao.

---

## Quyết định

Sử dụng **Pessimistic Locking** với `SELECT ... FOR UPDATE NOWAIT` kết hợp **Exponential Backoff Retry**.

### Cơ chế hoạt động:

```typescript
// Trong InventoryService.reserveStock()
async reserveStock(variantId: string, warehouseId: string, quantity: number, tx: PrismaTransaction) {
  // 1. Khóa dòng InventoryBalance — các transaction khác phải chờ
  const balance = await lockInventoryBalance(tx, variantId, warehouseId);

  // 2. Kiểm tra tồn kho khả dụng
  const available = balance.quantity - balance.reservedQuantity - balance.damagedQuantity;
  if (available < quantity) {
    throw new ConflictException('Insufficient stock');
  }

  // 3. Tăng reservedQuantity và commit
  return tx.inventoryBalance.update({
    where: { id: balance.id },
    data: { reservedQuantity: { increment: quantity } },
  });
}
```

### Retry với Exponential Backoff:
```typescript
// withRetry helper: tối đa 5 lần, bắt đầu từ 50ms, tăng gấp đôi
await withRetry(() => prisma.$transaction(reserveStock), { maxRetries: 5, baseDelay: 50 });
```

### Database Check Constraints (bảo vệ tầng vật lý):
```sql
ALTER TABLE "inventory_balances" ADD CONSTRAINT "chk_reserved_le_quantity"
  CHECK ("reservedQuantity" <= "quantity");
ALTER TABLE "inventory_balances" ADD CONSTRAINT "chk_quantity_positive"
  CHECK ("quantity" >= 0);
```

---

## Hệ quả (Consequences)

**Tích cực:**
- ✅ **Zero overselling**: Đảm bảo tuyệt đối không bán vượt tồn kho
- ✅ **Database-level safety net**: Check constraints là lớp bảo vệ cuối cùng ngay cả khi có bug ở tầng application
- ✅ **Đơn giản**: Không cần distributed lock service (Redis SETNX) phức tạp hơn

**Tiêu cực / Trade-off:**
- ⚠️ **Throughput giới hạn**: Dưới tải cực cao, nhiều request phải chờ nhau (acceptable vì sản phẩm cao cấp không có tải như fast-fashion)
- ⚠️ **NOWAIT có thể throw**: Nếu lock không lấy được ngay, throw `LockNotAvailableException` → retry logic phải handle
- ⚠️ **Deadlock risk**: Nếu hai transaction khóa theo thứ tự khác nhau → giải quyết bằng luôn lock theo `variantId` ASC

---

## Phương án đã loại bỏ

### Optimistic Locking (Version field)
**Lý do loại bỏ**: Với trang sức cao cấp, conflict rate cao hơn fast-fashion. Optimistic locking dẫn đến retry loop phía client, UX kém. Cần đảm bảo request đầu tiên thắng, không phải request nào retry nhanh nhất.

### Redis Distributed Lock (SETNX/Redlock)
**Lý do loại bỏ**: Thêm một điểm failure (Redis). Nếu Redis down, toàn bộ checkout bị block. PostgreSQL row lock đủ mạnh cho scale hiện tại.

### Application-level mutex
**Lý do loại bỏ**: Không hoạt động khi horizontal scale (nhiều Pod/instance).

---

## Liên quan

- [`inventory.service.ts`](file:///e:/Ray%20Paradis/backend/src/modules/inventory) — Implementation thực tế
- [Concurrency Control](../concurrency-control.md) — Mô tả chi tiết cơ chế
- [ADR-004: Outbox Pattern](./004-outbox-pattern.md) — Phần tiếp theo sau khi lock thành công
