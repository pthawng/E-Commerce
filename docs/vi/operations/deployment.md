# Operations — Deployment

> **Nguyên tắc**: Tài liệu này viết theo **reality hiện tại**, không theo aspirational target. Các phần K8s và Terraform được ghi rõ là reference manifests, chưa phải production setup hoàn chỉnh.

---

## 1. Tổng quan Deploy Stack

```
[Developer] → git push → [GitHub]
                              │
                        [GitHub Actions CI]
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        Build & Test    Lint & Security   Build Docker
              │                              Image
              └───────────────┴───────────────┘
                                   │
                             Push to GHCR
                         (GitHub Container Registry)
                                   │
                          [Target Platform]
                    (Render / Docker host / K8s cluster)
```

---

## 2. Docker Images

Mỗi service build thành Docker image riêng:

```dockerfile
# Build backend image (từ root monorepo)
docker build -f backend/Dockerfile -t ray-paradis-backend:latest .

# Build AI service image
docker build -f ai-service/Dockerfile -t ray-paradis-ai:latest .
```

**Image registry:** GitHub Container Registry (`ghcr.io/[owner]/ray-paradis/`)

---

## 3. CI/CD Pipeline (GitHub Actions)

File: `.github/workflows/`

**Gates phải pass trước khi merge:**
```yaml
# Các checks tự động chạy khi tạo PR
- name: Build check
  run: npm run build

- name: Unit tests
  run: npm run test --workspace=backend

- name: Lint
  run: npm run lint

- name: Security audit
  run: npm audit --audit-level=high
```

**Deploy flow (khi merge vào `main`):**
```yaml
- name: Build Docker image
  run: docker build -t ghcr.io/${{ github.repository }}/backend:${{ github.sha }} .

- name: Push to GHCR
  run: docker push ghcr.io/${{ github.repository }}/backend:${{ github.sha }}

- name: Deploy to target
  # Tùy platform (Render webhook, SSH, kubectl apply...)
```

---

## 4. Database Migration trong Deploy

```bash
# LUÔN chạy migrations TRƯỚC khi start service mới
npx prisma migrate deploy

# Chạy seed chỉ lần đầu (hoặc khi cần reset permissions)
NODE_ENV=production npx prisma db seed
```

> ⚠️ **Quan trọng**: Dùng `prisma migrate deploy` (không phải `dev`) trong CI/CD và production. Lệnh `deploy` chỉ apply pending migrations, không reset database.

---

## 5. Environment Variables Production

Xem danh sách đầy đủ tại: [Environment Variables Reference](./environment-vars.md)

**Minimum required để start:**
```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Redis
REDIS_URL="redis://:password@host:6379"

# JWT
JWT_SECRET="[strong random secret, min 32 chars]"
JWT_REFRESH_SECRET="[different strong random secret]"

# App
NODE_ENV=production
PORT=4000
```

---

## 6. K8s Reference Manifests

> **⚠️ Lưu ý quan trọng**: Các file trong [`infra/k8s/`](file:///e:/Ray%20Paradis/infra/k8s) là **reference manifests** — template starter, **chưa phải production-ready setup**.
>
> Cần bổ sung trước khi dùng thực tế: Ingress controller, TLS certificate (cert-manager), actual image registry credentials, proper ConfigMap/Secret management (Sealed Secrets hoặc External Secrets), network policies.

**File có sẵn:**

| File | Nội dung |
|------|---------|
| [`backend.yaml`](file:///e:/Ray%20Paradis/infra/k8s/backend.yaml) | Deployment + Service cho backend API (3 replicas, rolling update) |
| [`hpa.yaml`](file:///e:/Ray%20Paradis/infra/k8s/hpa.yaml) | Horizontal Pod Autoscaler config |

**Áp dụng lên cluster (sau khi đã cấu hình đúng):**
```bash
# Thay OWNER/REPOSITORY và IMAGE_TAG trước khi apply
kubectl apply -f infra/k8s/backend.yaml
kubectl apply -f infra/k8s/hpa.yaml
```

---

## 7. Terraform Reference

> **⚠️ Lưu ý quan trọng**: Các file trong [`infra/terraform/`](file:///e:/Ray%20Paradis/infra/terraform) là **AWS infrastructure starter templates**.
>
> Hiện có: VPC cơ bản (`vpc.tf`) và provider config (`main.tf`). Chưa có: RDS, ElastiCache, EKS cluster, IAM roles.

```bash
# Nếu mở rộng Terraform (DEV/staging environment)
cd infra/terraform
terraform init
terraform plan
terraform apply
```

---

## 8. Rollback Strategy

**Rollback nhanh (Docker):**
```bash
# Deploy image tag trước đó
docker pull ghcr.io/[owner]/ray-paradis/backend:[previous-sha]
docker stop backend-container
docker run ... ghcr.io/[owner]/ray-paradis/backend:[previous-sha]
```

**Rollback K8s:**
```bash
kubectl rollout undo deployment/ray-paradis-backend
kubectl rollout status deployment/ray-paradis-backend
```

**Rollback Database Migration:**
> Prisma không hỗ trợ automatic rollback. Cần viết migration ngược thủ công.
> Xem hướng dẫn: [Database Migration — Troubleshooting](../development/database-migration.md#7-troubleshooting)
