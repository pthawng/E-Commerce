# ADR-004: Transactional Outbox Pattern cho Domain Events

**Trạng thái**: `Accepted`
**Ngày**: 2025-01-01
**Tác giả**: Ray Paradis Engineering

---

## Bối cảnh

Sau khi đơn hàng được thanh toán thành công, hệ thống cần:
1. Trừ tồn kho thực tế (deduct from `InventoryBalance`)
2. Gửi email xác nhận đơn hàng
3. Cập nhật dashboard analytics
4. Trigger gợi ý sản phẩm cho AI service

Cách naive là gọi các action này đồng bộ trong cùng một request handler. Rủi ro:
- Nếu email service chậm → timeout cả đơn hàng
- Nếu một bước thất bại giữa chừng → dữ liệu không nhất quán (đơn hàng confirmed nhưng inventory chưa trừ)
- Không retry được khi downstream service tạm thời fail

---

## Quyết định

Sử dụng **Transactional Outbox Pattern** với BullMQ làm message queue.

### Cơ chế hoạt động:

```
[Order Service]
    │
    ├── 1. BEGIN TRANSACTION
    ├── 2. UPDATE order.status = 'CONFIRMED'
    ├── 3. INSERT domain_event_outbox (type='ORDER_CONFIRMED', payload={orderId})
    └── 4. COMMIT  ← Nếu commit fail, outbox cũng không được tạo (atomicity!)
         │
         ▼
[Outbox Worker - BullMQ]
    │── 5. Poll DomainEventOutbox table (mỗi 5 giây)
    │── 6. Đọc event chưa processed
    │── 7. Gửi vào BullMQ queue tương ứng
    └── 8. Mark event as processed
         │
         ▼
[BullMQ Consumers]
    ├── inventory.worker: deduct stock
    ├── mail.worker: send confirmation email
    └── analytics.worker: update dashboard
```

### Bảo đảm:
- **At-least-once delivery**: Nếu worker crash giữa chừng, job được retry tự động bởi BullMQ
- **Idempotency**: Mỗi consumer phải idempotent (kiểm tra đã xử lý chưa trước khi thực thi)

---

## Hệ quả (Consequences)

**Tích cực:**
- ✅ **Tách biệt domain**: Order service không biết về implementation của mail hay inventory deduction
- ✅ **Resilience**: Downstream service fail không ảnh hưởng đến việc confirm đơn hàng
- ✅ **Retry tự động**: BullMQ retry với exponential backoff khi consumer fail
- ✅ **Audit trail**: Tất cả events được lưu trong outbox table với timestamp

**Tiêu cực / Trade-off:**
- ⚠️ **Eventual consistency**: Inventory deduction xảy ra sau khi order confirmed, không phải ngay lập tức (chấp nhận được vì đã lock stock trước đó)
- ⚠️ **Phức tạp hơn**: Cần monitor outbox table, xử lý stuck events
- ⚠️ **Duplicate processing**: Consumer phải idempotent — lỗi phổ biến khi implement sai

---

## Phương án đã loại bỏ

### Synchronous chained calls
**Lý do loại bỏ**: Một service downstream slow/fail làm toàn bộ flow timeout. Không retry được.

### Saga Pattern (Choreography)
**Lý do loại bỏ**: Với Modular Monolith, Outbox đơn giản hơn nhiều. Saga phù hợp cho microservices distributed transactions.

### Direct BullMQ publish (không có Outbox)
**Lý do loại bỏ**: Nếu job được publish vào BullMQ nhưng database transaction sau đó rollback, job vẫn được xử lý → dữ liệu inconsistent. Outbox đảm bảo atomic: nếu DB transaction commit, event mới được tạo.

---

## Liên quan

- [`order.service.ts`](file:///e:/Ray%20Paradis/backend/src/modules/order/order.service.ts) — Nơi tạo outbox events
- [ADR-001: Modular Monolith](./001-modular-monolith.md) — Tại sao chọn Outbox thay vì Saga
- [ADR-003: Inventory Locking](./003-inventory-locking-strategy.md) — Xảy ra trước Outbox trong flow
