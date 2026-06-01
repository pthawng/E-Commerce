# Commit & Branching — Ray Paradis

> Quy ước Git giúp lịch sử commit dễ đọc, changelog tự động generate được, và review code hiệu quả hơn.

---

## 1. Branch Naming

Format: `[type]/[scope]-[short-description]`

| Type | Khi nào dùng | Ví dụ |
|------|-------------|-------|
| `feat/` | Tính năng mới | `feat/inventory-blind-stocktake` |
| `fix/` | Sửa bug | `fix/payment-double-charge` |
| `refactor/` | Refactor không thay đổi behavior | `refactor/order-service-extract-helpers` |
| `docs/` | Chỉ thay đổi tài liệu | `docs/adr-inventory-locking` |
| `chore/` | Deps update, config, scripts | `chore/upgrade-prisma-5.20` |
| `test/` | Chỉ thêm/sửa tests | `test/inventory-reservation-edge-cases` |
| `hotfix/` | Sửa khẩn cấp trên production | `hotfix/vnpay-webhook-signature` |

**Quy tắc:**
- Chữ thường, dấu gạch ngang, không dùng `_` hay camelCase
- Scope là tên module: `inventory`, `order`, `payment`, `auth`, `rbac`
- Ngắn gọn, đủ ý: `feat/order-cancellation-flow` thay vì `feat/add-the-cancel-order-button-to-the-order-service`

---

## 2. Commit Message — Conventional Commits

Format:
```
[type]([scope]): [short description]

[optional body]

[optional footer: BREAKING CHANGE hoặc Closes #issue]
```

### Types

| Type | Khi nào | Ảnh hưởng CHANGELOG |
|------|---------|---------------------|
| `feat` | Tính năng mới | ✅ Minor version bump |
| `fix` | Sửa bug | ✅ Patch version bump |
| `docs` | Chỉ docs | ❌ |
| `refactor` | Refactor | ❌ |
| `test` | Tests | ❌ |
| `chore` | Maintenance | ❌ |
| `perf` | Tối ưu hiệu năng | ✅ Patch |
| `revert` | Revert commit trước | ✅ Patch |

### Scopes (tên module)

`inventory` · `order` · `payment` · `auth` · `rbac` · `product` · `cart` · `ai` · `storefront` · `back-office` · `infra` · `docs` · `deps`

### Ví dụ commit tốt

```bash
# ✅ Đủ context, dễ đọc
feat(inventory): add blind stocktake session with RFID scan validation
fix(payment): prevent double charge on VNPay IPN replay attack
refactor(order): extract checkout validation into separate service
docs(adr): add ADR-003 for inventory pessimistic locking decision
chore(deps): upgrade @nestjs/core to 10.4.1

# ✅ Với body khi cần giải thích thêm
fix(inventory): resolve race condition in concurrent reserve stock

Previously, two simultaneous checkout requests for the same variant could
both succeed. Added SELECT FOR UPDATE NOWAIT with withRetry exponential
backoff to serialize conflicting transactions.

Closes #142

# ❌ Commit tệ — thiếu type, thiếu scope, không rõ
fix bug
update code
wip
```

---

## 3. Git Flow

### Nhánh chính

| Branch | Mục đích | Protected |
|--------|---------|-----------|
| `main` | Production-ready code | ✅ Require PR + review |
| `develop` | Integration branch | ✅ Require PR |

### Flow làm việc

```
main
 └── develop
      └── feat/inventory-blind-stocktake   ← Branch từ develop
           │
           ├── [code, commit, push]
           │
           └── Pull Request → develop
                │
                ├── CI checks pass (build, test, lint)
                ├── Code review approved
                └── Squash merge vào develop
                     │
                     └── (Release) Merge develop → main
```

### Hotfix Flow

```
main
 └── hotfix/vnpay-webhook-signature   ← Branch từ main, KHÔNG từ develop
      │
      ├── [minimal fix, test]
      └── PR → main (deploy ngay)
           └── Cherry-pick hoặc merge → develop
```

---

## 4. Pull Request Convention

### PR Title

Theo cùng format Conventional Commits:
```
feat(inventory): implement blind stocktake with RFID reconciliation
fix(payment): resolve JWT jti replay attack on VNPay IPN endpoint
```

### PR Size

| Size | Lines changed | Guideline |
|------|--------------|-----------|
| 🟢 Small | < 200 lines | Ideal, review nhanh |
| 🟡 Medium | 200-500 lines | Acceptable, chia PR nếu được |
| 🔴 Large | > 500 lines | Bắt buộc phải chia nhỏ |

> **Ngoại lệ duy nhất**: Database migration + service change đi cùng nhau có thể vượt 500 lines.

### PR Labels

| Label | Ý nghĩa |
|-------|---------|
| `needs-review` | Sẵn sàng review |
| `work-in-progress` | Đang phát triển, chưa review |
| `breaking-change` | Thay đổi breaking API |
| `migration-included` | Có Prisma migration |
| `needs-testing` | Cần test thủ công |

---

## 5. Rebase vs Merge

```bash
# ✅ Rebase feature branch trước khi tạo PR (giữ history sạch)
git checkout feat/my-feature
git rebase develop

# ✅ Squash merge khi merge feature vào develop (một commit cho một feature)
# Thực hiện qua GitHub UI: "Squash and merge"

# ❌ Không merge develop vào feature branch — dùng rebase
git merge develop  # ← Tránh
```

---

## 6. Tags & Versioning

```bash
# Tag release theo Semantic Versioning
git tag -a v1.2.0 -m "Release v1.2.0: Add blind stocktake feature"
git push origin v1.2.0
```

Format: `vMAJOR.MINOR.PATCH`
- **MAJOR**: Breaking change (API incompatible)
- **MINOR**: New feature, backward compatible
- **PATCH**: Bug fix
