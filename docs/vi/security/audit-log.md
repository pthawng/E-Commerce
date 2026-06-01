# Bảo mật — Audit Log

> Ray Paradis duy trì **hai hệ thống audit log độc lập** phục vụ hai mục đích khác nhau. Hiểu sự khác biệt quan trọng khi debug, compliance, hoặc dispute resolution.

---

## 1. Hai Loại Audit Log

| | InventoryLog | BackOfficeAuditLog |
|-|-------------|-------------------|
| **Ghi gì** | Biến động số lượng vật lý | Hành vi ra quyết định của người dùng |
| **Khi nào** | Nhập kho, xuất bán, điều chỉnh, kiểm kê | Duyệt/từ chối, cấu hình, assign role |
| **Link tới** | `InventoryBalance` | `BackOfficeUser` |
| **Mục đích** | Kế toán, đối soát tài chính | Security audit, compliance |
| **Lưu snapshot** | Số lượng trước/sau | `oldValue`/`newValue` JSON |

---

## 2. InventoryLog — Nhật ký Tồn kho

### Mục đích
Trả lời câu hỏi: *"Tại sao số lượng tồn kho thay đổi?"*

### Khi nào được tạo
- Nhập hàng vào kho (`STOCK_IN`)
- Xuất bán qua đơn hàng (`SOLD`)
- Điều chỉnh thủ công (`MANUAL_ADJUST`)
- Kết quả kiểm kê (`STOCKTAKE_ADJUST`)
- Hàng bị mất/thiếu/phát hiện lại (`LOST`, `MISSING`, `FOUND`, `WRITTEN_OFF`)
- Điều chuyển giữa kho (`TRANSFER_OUT`, `TRANSFER_IN`)

### Tại sao phân loại `LOST`/`MISSING`/`FOUND` thay vì `SOLD`?
Khi kiểm kê phát hiện chênh lệch, hàng không đơn giản là "mất doanh thu" như bán hàng. Phân loại đúng giúp:
- Số liệu doanh thu không bị làm hỏng
- Bảo hiểm có thể claim đúng loại sự cố
- Audit trail rõ ràng cho điều tra nội bộ

### Xem InventoryLog
```
GET /api/admin/inventory/logs?warehouseId=...&fromDate=...&toDate=...
```
Permission yêu cầu: `inventory.read`

---

## 3. BackOfficeAuditLog — Nhật ký Hành vi Admin

### Mục đích
Trả lời câu hỏi: *"Ai đã làm gì, lúc nào, và trước/sau như thế nào?"*

### Schema

```typescript
// Service: BackOfficeAuditLogService.log()
interface AuditLogParams {
  actorUserId?: string;    // Người thực hiện hành động
  targetUserId?: string;   // Người bị ảnh hưởng (nếu liên quan đến user)
  action: string;          // Mô tả hành động: 'TRANSFER_APPROVED', 'ROLE_ASSIGNED'
  resource: string;        // Loại resource: 'StockTransfer', 'BackOfficeUser'
  resourceId?: string;     // ID của resource bị ảnh hưởng
  oldValue?: string;       // JSON snapshot trạng thái trước
  newValue?: string;       // JSON snapshot trạng thái sau
  ipAddress?: string;      // IP của người thực hiện
  userAgent?: string;      // Browser/client info
}
```

### Ví dụ Log Records

**Duyệt điều chuyển kho:**
```json
{
  "actorUserId": "manager-uuid",
  "action": "STOCK_TRANSFER_APPROVED",
  "resource": "StockTransfer",
  "resourceId": "transfer-uuid",
  "oldValue": "{\"status\": \"PENDING\"}",
  "newValue": "{\"status\": \"APPROVED\"}",
  "ipAddress": "192.168.1.100"
}
```

**Gán role cho nhân viên:**
```json
{
  "actorUserId": "admin-uuid",
  "targetUserId": "employee-uuid",
  "action": "ROLE_ASSIGNED",
  "resource": "BackOfficeUser",
  "resourceId": "employee-uuid",
  "oldValue": "{\"roles\": []}",
  "newValue": "{\"roles\": [\"Nhân viên kho\"]}"
}
```

### Sử dụng BackOfficeAuditLogService

```typescript
// Inject và gọi sau mỗi action quan trọng
await this.auditLogService.log({
  actorUserId: currentUser.id,
  action: 'TRANSFER_APPROVED',
  resource: 'StockTransfer',
  resourceId: transfer.id,
  oldValue: JSON.stringify({ status: 'PENDING' }),
  newValue: JSON.stringify({ status: 'APPROVED' }),
});
```

### Quy tắc: Khi nào phải log?

Bắt buộc tạo `BackOfficeAuditLog` khi:
- ✅ Duyệt/từ chối bất kỳ workflow nào (transfer, stocktake)
- ✅ Thay đổi quyền hạn (gán role, assign permission)
- ✅ Thay đổi cấu hình hệ thống (insurance limit, warehouse settings)
- ✅ Xử lý chênh lệch kiểm kê (resolve discrepancy)
- ✅ Bất kỳ thao tác nào có `oldValue` → `newValue`

Không cần log:
- ❌ Đọc dữ liệu (GET requests) — quá nhiều noise
- ❌ Login/Logout — đã có trong auth session logs

---

## 4. Xem Audit Logs

```
GET /api/admin/audit-logs?actorUserId=...&resource=...&action=...&limit=50&offset=0
```

Permission yêu cầu: `system.setting.read` hoặc tùy theo resource

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "action": "TRANSFER_APPROVED",
      "resource": "StockTransfer",
      "actor": { "id": "uuid", "email": "manager@example.com", "fullName": "Nguyễn A" },
      "oldValue": "...",
      "newValue": "...",
      "createdAt": "2025-06-01T10:30:00Z"
    }
  ],
  "total": 150
}
```

---

## 5. Retention Policy

| Log Type | Retention | Lý do |
|----------|-----------|-------|
| `InventoryLog` | Không giới hạn | Dữ liệu kế toán, cần lưu vĩnh viễn |
| `BackOfficeAuditLog` | Không giới hạn | Compliance và dispute resolution |

> Xem xét archiving dữ liệu cũ hơn 2 năm sang cold storage (S3 Glacier) khi database size tăng đáng kể.
