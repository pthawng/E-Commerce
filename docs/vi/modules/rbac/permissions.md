# Danh sách Permissions — Ray Paradis

> **Nguồn chân lý**: File này được đồng bộ thủ công từ [`permissions.constants.ts`](file:///e:/Ray%20Paradis/backend/src/modules/rbac/permissions.constants.ts).
> Khi thêm permission mới, cập nhật cả hai file.

---

## Cấu trúc Permission Slug

```
[domain].[resource].[action]

Ví dụ:
  inventory.transfer     ← Domain: inventory, Resource+Action: transfer
  product.variant.create ← Domain: product, Resource: variant, Action: create
  order.refund           ← Domain: order, Action: refund
```

---

## Auth Domain

Quản lý người dùng và vai trò trong hệ thống back-office.

| Slug | Mô tả |
|------|-------|
| `auth.role.create` | Tạo role mới |
| `auth.role.read` | Xem danh sách roles và permissions |
| `auth.role.update` | Chỉnh sửa thông tin role |
| `auth.role.delete` | Xóa role |
| `auth.user.create` | Tạo tài khoản back-office user |
| `auth.user.read` | Xem danh sách và chi tiết users |
| `auth.user.update` | Cập nhật thông tin user |
| `auth.user.delete` | Vô hiệu hóa tài khoản user |
| `auth.user.assign-role` | Gán hoặc xóa role của user |
| `auth.user.assign-permission` | Gán direct permission override cho user |

---

## Product Domain

Quản lý catalog sản phẩm: danh mục, thuộc tính, sản phẩm, biến thể.

| Slug | Mô tả |
|------|-------|
| `product.category.create` | Tạo danh mục sản phẩm |
| `product.category.read` | Xem danh mục |
| `product.category.update` | Sửa danh mục |
| `product.category.delete` | Xóa danh mục |
| `product.attribute.create` | Tạo attribute (chất liệu, giác cắt, size...) |
| `product.attribute.read` | Xem attributes |
| `product.attribute.update` | Sửa attribute |
| `product.attribute.delete` | Xóa attribute |
| `product.item.create` | Tạo sản phẩm mới |
| `product.item.read` | Xem chi tiết sản phẩm |
| `product.item.update` | Cập nhật thông tin sản phẩm |
| `product.item.delete` | Xóa sản phẩm |
| `product.variant.create` | Tạo biến thể sản phẩm |
| `product.variant.read` | Xem biến thể |
| `product.variant.update` | Sửa biến thể |
| `product.variant.delete` | Xóa biến thể |
| `product.variant.manage` | Quản lý toàn bộ biến thể (bao gồm pricing) |

---

## Catalog Domain

Xuất bản và quản lý giá sản phẩm trên storefront.

| Slug | Mô tả |
|------|-------|
| `catalog.product.read` | Xem sản phẩm trong catalog back-office |
| `catalog.product.create` | Thêm sản phẩm vào catalog |
| `catalog.product.update` | Cập nhật thông tin catalog |
| `catalog.product.publish` | Publish/unpublish sản phẩm lên storefront |
| `catalog.product.delete` | Xóa khỏi catalog |
| `catalog.pricing.read` | Xem lịch sử và cấu hình giá |
| `catalog.pricing.update` | Cập nhật giá bán |
| `catalog.import.create` | Import sản phẩm hàng loạt |
| `catalog.audit.read` | Xem lịch sử thay đổi catalog |

---

## Order Domain

Quản lý đơn hàng và vận chuyển.

| Slug | Mô tả |
|------|-------|
| `order.read` | Xem đơn hàng và lịch sử |
| `order.update` | Cập nhật trạng thái đơn hàng |
| `order.delete` | Xóa đơn hàng (hiếm khi dùng) |
| `order.payment.manage` | Xem và quản lý thanh toán đơn |
| `order.shipment.manage` | Cập nhật thông tin vận chuyển, tracking |
| `order.refund` | Duyệt và thực thi hoàn tiền |

---

## Inventory Domain

Quản lý kho bãi, két sắt, điều chuyển và kiểm kê.

| Slug | Mô tả |
|------|-------|
| `inventory.read` | Xem tồn kho, vị trí hàng, lịch sử biến động |
| `inventory.manage` | Toàn quyền quản lý inventory (bao gồm cấu hình kho) |
| `inventory.transfer` | Tạo và xử lý phiếu điều chuyển |
| `inventory.adjust` | Điều chỉnh tồn kho thủ công (cần audit trail) |

---

## Ledger Domain

Xem và quản lý dữ liệu tài chính nội bộ.

| Slug | Mô tả |
|------|-------|
| `ledger.view` | Xem sổ cái và báo cáo tài chính |
| `ledger.manage` | Chỉnh sửa entries trong ledger (CFO only) |

---

## Dashboard Domain

| Slug | Mô tả |
|------|-------|
| `dashboard.view` | Xem dashboard analytics và KPIs |

---

## System Domain

Cấu hình hệ thống cấp cao.

| Slug | Mô tả |
|------|-------|
| `system.setting.read` | Xem cấu hình hệ thống |
| `system.setting.update` | Thay đổi cấu hình hệ thống |

---

## CRM Domain

Quản lý quan hệ khách hàng và chăm sóc VIP.

| Slug | Mô tả |
|------|-------|
| `crm.guest.read` | Xem danh sách khách vãng lai |
| `crm.vip-care.read` | Xem thông tin khách VIP |
| `crm.vip-care.manage` | Quản lý chăm sóc khách VIP |

---

## Gán Permissions cho Roles — Gợi ý

| Role | Permissions được gán |
|------|----------------------|
| `Nhân viên kho` | `inventory.read`, `inventory.transfer` |
| `Quản lý Showroom` | `inventory.*`, `order.read`, `order.update`, `order.shipment.manage` |
| `Nhân viên kinh doanh` | `catalog.product.read`, `order.read` |
| `Quản lý Catalog` | `catalog.*`, `product.*` |
| `Kế toán / CFO` | `ledger.*`, `order.payment.manage`, `order.refund`, `dashboard.view` |
| `Admin vận hành` | Tất cả trừ `system.*` và `auth.role.*` |
| `Super Admin` | Toàn bộ permissions |

---

## Quy trình Thêm Permission Mới

1. Thêm slug vào [`permissions.constants.ts`](file:///e:/Ray%20Paradis/backend/src/modules/rbac/permissions.constants.ts)
2. Thêm vào [`permissions.seed.ts`](file:///e:/Ray%20Paradis/backend/src/modules/rbac/permissions.seed.ts) để seed vào database
3. Cập nhật bảng tương ứng trong file này
4. Apply `@RequirePermissions()` decorator vào endpoint cần bảo vệ
5. Cập nhật bảng "Gán Permissions cho Roles" nếu có role mặc định phù hợp
