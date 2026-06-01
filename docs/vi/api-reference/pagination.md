# API Reference — Phân trang (Pagination)

## 1. Offset Pagination (Mặc định)

Áp dụng cho hầu hết các listing endpoints.

**Request:**
```
GET /api/admin/orders?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

**Response:**
```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

**Query Params:**

| Param | Type | Default | Giới hạn | Mô tả |
|-------|------|---------|----------|-------|
| `page` | `number` | `1` | ≥ 1 | Trang hiện tại |
| `limit` | `number` | `20` | 1-100 | Số items mỗi trang |
| `sortBy` | `string` | `createdAt` | Xem docs endpoint | Field để sort |
| `sortOrder` | `asc\|desc` | `desc` | - | Thứ tự sort |

## 2. Giá trị Limit Tối đa

Tất cả listing endpoints giới hạn `limit` tối đa **100** để bảo vệ database.

```typescript
// ❌ Request này sẽ bị giới hạn xuống 100
GET /api/admin/orders?limit=1000

// → Trả về 100 items, không phải 1000
```

## 3. Frontend Handling

```typescript
// TanStack Query example
const { data } = useQuery({
  queryKey: ['orders', page, limit],
  queryFn: () => api.get('/admin/orders', { params: { page, limit } }),
});

const totalPages = Math.ceil(data.total / limit);
```
