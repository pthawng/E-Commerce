# API Reference — Error Codes & Response Format

> Tất cả lỗi trong Ray Paradis API đều tuân theo một format thống nhất. Trang này là nguồn tham chiếu duy nhất — không cần đoán format khi debug.

---

## 1. Standard Error Response Format

```typescript
interface ErrorResponse {
  statusCode: number;   // HTTP status code
  message: string | string[];  // Mô tả lỗi (string[] khi validation fails)
  error: string;        // HTTP status text
  timestamp: string;    // ISO 8601 timestamp
  path: string;         // Request path
}
```

**Ví dụ — Validation Error (400):**
```json
{
  "statusCode": 400,
  "message": [
    "name must be a string",
    "price must be a positive number"
  ],
  "error": "Bad Request",
  "timestamp": "2025-06-01T10:30:00.000Z",
  "path": "/api/admin/products"
}
```

**Ví dụ — Not Found (404):**
```json
{
  "statusCode": 404,
  "message": "Product variant abc-123 not found",
  "error": "Not Found",
  "timestamp": "2025-06-01T10:30:00.000Z",
  "path": "/api/products/abc-123"
}
```

**Ví dụ — Conflict (409):**
```json
{
  "statusCode": 409,
  "message": "Insufficient stock for variant ring-gold-18k at warehouse HN-01",
  "error": "Conflict",
  "timestamp": "2025-06-01T10:30:00.000Z",
  "path": "/api/orders"
}
```

---

## 2. HTTP Status Codes — Ray Paradis Convention

| Status | Khi nào | Ví dụ |
|--------|---------|-------|
| `200 OK` | Request thành công, có data | GET, PATCH trả về resource |
| `201 Created` | Resource mới được tạo | POST tạo order, product |
| `204 No Content` | Thành công, không có response body | DELETE |
| `400 Bad Request` | Input validation fail | Thiếu field bắt buộc, sai kiểu dữ liệu |
| `401 Unauthorized` | Chưa đăng nhập hoặc token hết hạn | Cookie không có, token expired |
| `403 Forbidden` | Đã đăng nhập nhưng không đủ permission | Nhân viên kho truy cập ledger |
| `404 Not Found` | Resource không tồn tại | Order ID không có trong DB |
| `409 Conflict` | Conflict nghiệp vụ | Hết hàng, duplicate SKU, race condition |
| `422 Unprocessable Entity` | Dữ liệu hợp lệ về format nhưng không xử lý được | Transfer từ và đến cùng kho |
| `429 Too Many Requests` | Rate limit exceeded | Quá nhiều request trong 1 phút |
| `500 Internal Server Error` | Lỗi server không xử lý được | Database connection fail |

---

## 3. Business Error Codes

Một số lỗi nghiệp vụ đặc thù có thêm field `code` trong response:

```json
{
  "statusCode": 409,
  "message": "Stock reservation failed due to concurrent request",
  "error": "Conflict",
  "code": "INVENTORY_LOCK_FAILED",
  "retryAfter": 1000
}
```

| Code | Ý nghĩa | Action khuyến nghị |
|------|---------|-------------------|
| `INVENTORY_LOCK_FAILED` | Race condition khi reserve stock | Retry sau `retryAfter` ms |
| `PAYMENT_ALREADY_PROCESSED` | Webhook đã được xử lý | Bỏ qua, không retry |
| `ORDER_STATE_INVALID` | Không thể transition sang state yêu cầu | Kiểm tra state machine |
| `REFRESH_TOKEN_REVOKED` | Refresh token đã bị revoke (có thể bị đánh cắp) | Redirect về login |
| `IDEMPOTENCY_CONFLICT` | Idempotency key đã dùng với request khác | Dùng key mới |

---

## 4. Validation Errors — Chi tiết

Khi POST/PATCH với body không hợp lệ, `message` là **mảng** các lỗi:

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters",
    "phone must match /^(0|\+84)[0-9]{9}$/ regular expression"
  ],
  "error": "Bad Request"
}
```

**Frontend handling:**
```typescript
try {
  await api.post('/api/auth/register', data);
} catch (error) {
  if (error.response?.status === 400) {
    const messages = error.response.data.message;
    // messages có thể là string hoặc string[]
    const errorList = Array.isArray(messages) ? messages : [messages];
    setErrors(errorList);
  }
}
```

---

## 5. Không có Error Response Body

Một số trường hợp đặc biệt:
- **Rate limit (429)**: Header `Retry-After: <seconds>` được thêm vào response
- **Webhook validation fail**: Return specific format theo yêu cầu cổng thanh toán (không phải standard format trên)
