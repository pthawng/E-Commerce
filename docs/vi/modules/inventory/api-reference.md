# Tài liệu tham chiếu API - Kho Két & Hàng tồn

Mọi yêu cầu gửi lên API đều bắt buộc đính kèm mã xác thực (Bearer Token) trong Header và chịu sự kiểm tra phân quyền tài khoản (RBAC).

---

### Lấy Số liệu Tổng quan (Metrics Overview)
Trả về các số liệu thống kê tổng hợp về giá trị kho hàng, giới hạn bảo hiểm và tình trạng gắn tag RFID.

- **Method & Path:** `GET /api/back-office/inventory/overview`
- **Quyền yêu cầu:** `inventory:read`
- **Ví dụ phản hồi thành công:**
```json
{
  "success": true,
  "data": {
    "totalInsuranceValue": 156000000.00,
    "rfidTaggedPercentage": 98.4,
    "inTransitCount": 12,
    "discrepancyCount": 2,
    "inventoryHealth": { "healthy": 85, "lowStock": 10, "deadStock": 5 }
  }
}
```

---

### Tạo yêu cầu Điều chuyển kho
Khởi động luồng vận chuyển hàng hóa giữa hai showroom hoặc kho trung tâm.

- **Method & Path:** `POST /api/back-office/inventory/transfers`
- **Quyền yêu cầu:** `inventory:transfer:create`
- **Request Body:**
```json
{
  "fromWarehouseId": "uuid-111",
  "toWarehouseId": "uuid-222",
  "note": "Điều chuyển hàng phục vụ sự kiện trưng bày",
  "items": [
    {
      "productVariantId": "uuid-var-1",
      "physicalItemId": "uuid-phys-1",
      "quantity": 1
    }
  ]
}
```
- **Phản hồi:** Đối tượng `StockTransfer` được khởi tạo với trạng thái `PENDING`.

---

### Phê duyệt yêu cầu Điều chuyển
Quản lý duyệt yêu cầu vận chuyển hàng đi.

- **Method & Path:** `PATCH /api/back-office/inventory/transfers/:id/approve`
- **Quyền yêu cầu:** `inventory:transfer:approve`
- **Phản hồi:** Trạng thái phiếu điều chuyển cập nhật thành `APPROVED`.

---

### Từ chối yêu cầu Điều chuyển
Quản lý từ chối yêu cầu và ghi lại lý do.

- **Method & Path:** `PATCH /api/back-office/inventory/transfers/:id/reject`
- **Quyền yêu cầu:** `inventory:transfer:reject`
- **Request Body:**
```json
{
  "reason": "Két sắt tại showroom đích đã vượt quá giới hạn bảo hiểm cho phép."
}
```
- **Phản hồi:** Trạng thái phiếu điều chuyển cập nhật thành `REJECTED`.

---

### Xác nhận xuất hàng vận chuyển (Ship)
Nhân viên kho quét danh sách chip RFID vật lý để giao hàng cho đơn vị vận chuyển.

- **Method & Path:** `PATCH /api/back-office/inventory/transfers/:id/ship`
- **Quyền yêu cầu:** `inventory:transfer:ship`
- **Request Body:**
```json
{
  "scannedRfidTags": ["RFID-10023912", "RFID-10023913"]
}
```
- **Phản hồi:** Trạng thái phiếu chuyển sang `SHIPPED`. Các sản phẩm liên kết chuyển sang trạng thái `TRANSITING`.

---

### Xác nhận nhận hàng điều chuyển (Receive)
Nhận hàng tại showroom đích bằng cách quét đối soát lại chip RFID vật lý.

- **Method & Path:** `PATCH /api/back-office/inventory/transfers/:id/receive`
- **Quyền yêu cầu:** `inventory:transfer:receive`
- **Request Body:**
```json
{
  "scannedRfidTags": ["RFID-10023912", "RFID-10023913"]
}
```
- **Phản hồi:** Trạng thái phiếu chuyển sang `COMPLETED`. Các món trang sức chuyển sang trạng thái `IN_VAULT` tại kho đích.

---

### Giải quyết lệch kho (Resolve Discrepancy)
Xử lý các dòng sản phẩm bị lệch thừa/thiếu sau khi kết thúc phiên kiểm kê.

- **Method & Path:** `POST /api/back-office/inventory/discrepancies/:id/resolve`
- **Quyền yêu cầu:** `inventory:audit:resolve` (Yêu cầu vai trò CFO hoặc Admin cao cấp)
- **Request Body:**
```json
{
  "action": "DEDUCT_LOSS",
  "targetStatus": "LOST", // LOST, MISSING, WRITTEN_OFF (Tránh dùng SOLD để không làm hỏng dữ liệu doanh thu)
  "note": "Khấu hao món hàng bị mất trong buổi trưng bày."
}
```
- **Phản hồi:** Áp dụng xử lý chênh lệch thành công, cập nhật số dư tồn kho thực tế.
