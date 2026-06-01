# ADR-001: Lựa chọn Kiến trúc Modular Monolith

**Trạng thái**: `Accepted`
**Ngày**: 2025-01-01
**Tác giả**: Ray Paradis Engineering

---

## Bối cảnh

Ray Paradis là nền tảng thương mại điện tử trang sức cao cấp với các module nghiệp vụ phức tạp và phụ thuộc chặt chẽ vào nhau: đặt hàng phải trừ tồn kho, thanh toán phải cập nhật đơn hàng, kiểm kho phải khóa tài sản vật lý. Cần chọn kiến trúc phù hợp để phát triển một team nhỏ nhưng vẫn đảm bảo tính mô-đun.

Các lựa chọn đã cân nhắc:
1. **Monolith truyền thống** — Tất cả trong một, không tách biệt module
2. **Modular Monolith** — Tách biệt logic theo module, deploy chung một process
3. **Microservices** — Mỗi domain là một service độc lập

---

## Quyết định

Chọn **Modular Monolith** với NestJS Dependency Injection làm ranh giới module.

Cụ thể:
- Mỗi module (`inventory`, `order`, `payment`, ...) là một `@Module()` NestJS riêng biệt
- Các module **không import trực tiếp repository/service của nhau** — giao tiếp qua interface hoặc Domain Events
- Prisma Query Extensions chặn các truy vấn DB trực tiếp không qua tầng Service
- Chỉ có một AI service tách thành process riêng biệt vì tải tính toán độc lập

---

## Hệ quả (Consequences)

**Tích cực:**
- ✅ Deploy đơn giản: một binary, một database connection pool
- ✅ ACID transactions cross-module (inventory + order trong cùng một Prisma `$transaction`)
- ✅ Onboarding nhanh hơn: dev chỉ cần hiểu một codebase
- ✅ Refactor dễ hơn microservices khi domain model thay đổi

**Tiêu cực / Trade-off:**
- ⚠️ Scale theo chiều ngang bị giới hạn ở mức process (không scale từng module riêng)
- ⚠️ Một bug nghiêm trọng ảnh hưởng toàn bộ hệ thống (mitigated bằng liveness probe + K8s restart)
- ⚠️ Phải discipline cao trong team để không tạo circular dependency giữa modules

---

## Phương án đã loại bỏ

### Microservices
**Lý do loại bỏ**: Với team nhỏ, overhead vận hành (service mesh, distributed tracing, saga pattern cho cross-service transactions) vượt quá lợi ích. Đặc biệt, checkout cần atomic lock inventory + create order trong cùng một transaction — cross-service ACID rất khó đảm bảo.

### Monolith truyền thống
**Lý do loại bỏ**: Không có ranh giới module rõ ràng dẫn đến "spaghetti code" khi team mở rộng. Khó onboard dev mới khi toàn bộ logic nằm trong một layer.

---

## Liên quan

- [ADR-004: Outbox Pattern](./004-outbox-pattern.md) — Cách giao tiếp cross-module async
- [`app.module.ts`](file:///e:/Ray%20Paradis/backend/src/app.module.ts) — Đăng ký toàn bộ modules
