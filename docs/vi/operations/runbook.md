# Runbook — Xử lý Sự cố Thường gặp

> Tài liệu này dành cho người cần xử lý sự cố nhanh. Mỗi mục có triệu chứng, nguyên nhân, và bước xử lý cụ thể.

---

## 1. Checkout Bị Lỗi 409 "Insufficient Stock"

**Triệu chứng**: Khách hàng nhận lỗi 409 khi checkout dù sản phẩm hiển thị còn hàng trên trang.

**Nguyên nhân phổ biến**:
- `reservedQuantity` đang bị giữ bởi đơn hàng chưa thanh toán
- Race condition (nhiều người checkout cùng lúc)

**Xử lý**:
```sql
-- Kiểm tra reservedQuantity thực tế
SELECT quantity, "reservedQuantity", "damagedQuantity",
       quantity - "reservedQuantity" - "damagedQuantity" AS available
FROM inventory_balances
WHERE "productVariantId" = '[variant-id]';

-- Nếu có reservation cũ đã expired
SELECT * FROM inventory_reservations
WHERE "productVariantId" = '[variant-id]' AND status = 'ACTIVE' AND "expiresAt" < NOW();
```

**Fix nếu có expired reservations**:
BullMQ timeout job có thể bị stuck. Chạy thủ công:
```bash
# Trigger cleanup job qua admin API
POST /api/admin/system/cleanup-expired-reservations
```

---

## 2. Payment Webhook Không Nhận được

**Triệu chứng**: Khách đã thanh toán thành công (theo ngân hàng) nhưng đơn hàng vẫn ở `AWAITING_PAYMENT`.

**Kiểm tra**:
1. Xem logs backend cho request đến `/api/webhooks/vnpay` hoặc `/api/webhooks/paypal`
2. Kiểm tra VNPay/PayPal merchant portal: webhook URL có đúng không?
3. Kiểm tra HMAC signature trong logs

**Nếu webhook đã đến nhưng bị reject**:
```bash
# Xem payment records
GET /api/admin/payments?orderId=[order-id]
```

**Xử lý thủ công** (sau khi xác nhận payment từ ngân hàng):
```bash
POST /api/admin/orders/[order-id]/manual-confirm
Body: { "paymentReference": "[bank-transaction-id]", "reason": "Manual confirm after webhook failure" }
```

---

## 3. Redis Down — Permissions Không Load

**Triệu chứng**: Tất cả admin requests trả về 403, kể cả Super Admin.

**Kiểm tra**:
```bash
docker exec ray-paradis-redis redis-cli -a redis_pass ping
# Phải trả về PONG
```

**Xử lý**:
```bash
# Restart Redis container
docker restart ray-paradis-redis

# Kiểm tra logs
docker logs ray-paradis-redis --tail 50
```

**Nếu Redis không thể khởi động**: Hệ thống fallback về query DB trực tiếp (chậm hơn nhưng vẫn hoạt động). Không cần restart backend.

---

## 4. Database Migration Failed khi Deploy

**Triệu chứng**: Container backend crash ngay sau deploy với lỗi Prisma migration.

**Kiểm tra**:
```bash
# Xem migration status
npx prisma migrate status

# Xem migration log cụ thể
SELECT * FROM "_prisma_migrations" ORDER BY "started_at" DESC LIMIT 5;
```

**Nếu migration bị stuck ở FAILED**:
```sql
-- Xem migration đang fail
SELECT id, migration_name, finished_at, rolled_back_at, logs
FROM "_prisma_migrations"
WHERE finished_at IS NULL;
```

**Rollback thủ công**:
1. Xác định nguyên nhân fail trong `logs` column
2. Fix dữ liệu hoặc schema nếu cần
3. Mark migration failed: `UPDATE "_prisma_migrations" SET rolled_back_at = NOW() WHERE id = '[id]'`
4. Tạo migration mới để fix

---

## 5. Qdrant / AI Service Down

**Triệu chứng**: Trang sản phẩm load chậm hoặc "Gợi ý sản phẩm" không hiển thị.

**Hành vi mong đợi**: Circuit Breaker đã được cài — API chính vẫn hoạt động, chỉ recommendation bị fallback về kết quả rỗng hoặc default.

**Kiểm tra**:
```bash
# Kiểm tra Qdrant
curl http://localhost:6333/health

# Kiểm tra AI service
curl http://localhost:4001/health
```

**Khởi động lại**:
```bash
docker restart ray-paradis-qdrant
cd ai-service && npm run dev
```

**Sau khi restore**: Vector data trong Qdrant vẫn còn (persistent volume). Không cần re-embed toàn bộ products.

---

## 6. BullMQ Jobs Stuck / Not Processing

**Triệu chứng**: Emails không được gửi, inventory không được trừ sau payment.

**Kiểm tra BullMQ queue status**:
```bash
# Qua Bull Board (nếu đã setup) hoặc Redis CLI
docker exec ray-paradis-redis redis-cli -a redis_pass KEYS "bull:*"
```

**Kiểm tra Outbox events**:
```sql
-- Events chưa được xử lý
SELECT * FROM domain_event_outbox
WHERE processed_at IS NULL
ORDER BY created_at ASC
LIMIT 20;
```

**Retry thủ công**:
```bash
# Trigger outbox processing
POST /api/admin/system/process-outbox
```

---

## 7. Liên hệ Escalation

| Vấn đề | Contact |
|--------|---------|
| Payment dispute với VNPay | VNPay merchant support + cung cấp `providerTransactionId` |
| Database corruption | DBA on-call |
| Security incident (breach suspected) | Immediately revoke all sessions + notify security team |

```bash
# Revoke tất cả sessions khẩn cấp
POST /api/admin/system/revoke-all-sessions
```
