# Giới thiệu — Ray Paradis

**Ray Paradis** là nền tảng thương mại điện tử headless được xây dựng riêng cho nghiệp vụ bán lẻ trang sức cao cấp — nơi mỗi sản phẩm có thể là độc bản, giá tính động theo giá vàng/đá quý, và quy trình kiểm soát tồn kho yêu cầu độ chính xác như hệ thống tài chính.

---

## Hệ thống gồm những gì?

```
┌─────────────────────────────────────────────────────────────┐
│                      Ray Paradis Monorepo                   │
├─────────────────┬───────────────┬───────────────────────────┤
│   Storefront    │  Back-Office  │        AI Service         │
│  (React + Vite) │ (React + Vite)│     (NestJS + Qdrant)    │
├─────────────────┴───────────────┤                           │
│           Backend API           │  Vector embeddings &      │
│      (NestJS Modular Monolith)  │  semantic search          │
│   PostgreSQL · Redis · BullMQ   │                           │
└─────────────────────────────────┴───────────────────────────┘
```

| Workspace | Vai trò |
|-----------|---------|
| `backend` | API core, business logic, database, payment webhooks |
| `storefront` | Giao diện mua sắm cho khách hàng |
| `back-office` | Giao diện vận hành cho nhân viên |
| `ai-service` | Tạo vector embeddings, semantic search recommendations |
| `shared` | TypeScript types và Zod schemas dùng chung |
| `infra` | Docker Compose (dev), K8s và Terraform reference manifests |
| `docs` | Tài liệu này |

---

## Điểm đặc trưng kỹ thuật

- **Tồn kho không âm tuyệt đối**: PostgreSQL Check Constraints + Pessimistic Locking
- **Session bảo mật**: HTTP-Only Cookie, CSRF protection, Refresh Token Rotation
- **Phân quyền có cache**: RBAC/ABAC tree được flatten và cache trong Redis
- **Thanh toán idempotent**: Chống replay attack cho VNPay và PayPal webhooks
- **AI Recommendations**: Google Gemini embeddings → Qdrant vector search với Circuit Breaker

---

## Navigation Docs này

| Nếu bạn là... | Bắt đầu từ |
|---------------|-----------|
| Dev mới onboard | [Quick Start →](./quick-start.md) |
| Muốn hiểu kiến trúc | [System Overview →](../architecture/system-overview.md) |
| Muốn biết tại sao quyết định X | [ADRs →](../architecture/adr/) |
| Đang làm feature cho module cụ thể | [Module Docs →](../modules/) |
| Cần tích hợp API | [API Reference →](../api-reference/authentication.md) |
| DevOps/deploy | [Operations →](../operations/local-dev.md) |
| Security review | [Security →](../security/overview.md) |
