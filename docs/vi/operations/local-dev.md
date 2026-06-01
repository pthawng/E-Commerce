# Operations — Local Development Setup

> Hướng dẫn khởi chạy toàn bộ Ray Paradis monorepo trên máy local. Mục tiêu: từ `git clone` đến có app chạy trong **dưới 15 phút**.

---

## 1. Yêu cầu Hệ thống

| Tool | Version tối thiểu | Kiểm tra |
|------|------------------|---------|
| Node.js | 20+ | `node --version` |
| npm | 10+ | `npm --version` |
| Docker Desktop | Latest | `docker --version` |
| Git | Latest | `git --version` |

---

## 2. Khởi động Infrastructure (Docker)

Toàn bộ services phụ thuộc chạy qua Docker Compose:

```bash
# Khởi động PostgreSQL + Redis + Qdrant + Mailpit
docker compose -f infra/docker-compose.dev.yml up -d

# Kiểm tra tất cả container đang chạy healthy
docker compose -f infra/docker-compose.dev.yml ps
```

**Services được khởi động:**

| Service | Port | Mục đích |
|---------|------|---------|
| PostgreSQL 16 | `5432` | Database chính |
| Redis 7 | `6379` | Permission cache + BullMQ queues |
| Qdrant | `6333` | Vector database cho AI recommendations |
| Mailpit | `8025` (UI) / `1025` (SMTP) | Bắt email local — không gửi thật |

**Credentials mặc định (DEV ONLY):**
```
PostgreSQL: host=localhost, db=ecommerce, user=ecommerce_user, pass=ecommerce_pass
Redis: password=redis_pass
```

---

## 3. Cài đặt Dependencies

```bash
# Cài đặt tất cả workspace packages từ root
npm install
```

---

## 4. Cấu hình Environment Variables

Mỗi workspace có file `.env` riêng. Copy từ `.env.example`:

```bash
# Backend
cp backend/.env.example backend/.env   # (Nếu có file example)

# AI Service
cp ai-service/.env.example ai-service/.env

# Storefront
cp storefront/.env.example storefront/.env.development
```

**Xem chi tiết từng biến:** [Environment Variables Reference](./environment-vars.md)

---

## 5. Database Setup

```bash
# Di chuyển vào thư mục backend
cd backend

# Chạy tất cả migrations
npx prisma migrate dev

# Seed dữ liệu mẫu (permissions, roles, products mẫu)
npx prisma db seed

# (Optional) Mở Prisma Studio để xem data
npx prisma studio
```

---

## 6. Chạy All Services

```bash
# Từ root — chạy tất cả workspaces đồng thời
npm run dev
```

**Hoặc chạy riêng từng workspace:**

```bash
# Terminal 1: Backend API
cd backend && npm run dev

# Terminal 2: AI Service
cd ai-service && npm run dev

# Terminal 3: Storefront
cd storefront && npm run dev

# Terminal 4: Back-Office
cd back-office && npm run dev
```

---

## 7. Endpoints

| Service | URL | Mô tả |
|---------|-----|-------|
| **Backend API** | `http://localhost:4000` | Core REST API |
| **Swagger UI** | `http://localhost:4000/api/docs` | API documentation & testing |
| **Storefront** | `http://localhost:5173` | Trang mua sắm khách hàng |
| **Back-Office** | `http://localhost:3000` | Giao diện vận hành |
| **Mailpit UI** | `http://localhost:8025` | Xem email được gửi đi (local only) |
| **Prisma Studio** | `http://localhost:5555` | Database browser (chạy `npx prisma studio`) |
| **Qdrant UI** | `http://localhost:6333/dashboard` | Vector DB browser |

---

## 8. Tài khoản Mặc định (Seed Data)

Sau khi chạy `prisma db seed`:

| Role | Email | Password |
|------|-------|---------|
| Super Admin | `admin@rayparadis.com` | `Admin@123` |
| Quản lý | `manager@rayparadis.com` | `Manager@123` |
| Nhân viên kho | `warehouse@rayparadis.com` | `Warehouse@123` |

> **Quan trọng**: Đây là dữ liệu DEV ONLY. KHÔNG dùng credentials này cho production.

---

## 9. Dừng Infrastructure

```bash
# Dừng tất cả container (giữ data)
docker compose -f infra/docker-compose.dev.yml down

# Dừng và XÓA toàn bộ data (reset hoàn toàn)
docker compose -f infra/docker-compose.dev.yml down -v
```

---

## 10. Troubleshooting Thường Gặp

### Port đã bị chiếm

```bash
# Kiểm tra port nào đang dùng
netstat -ano | findstr :5432   # Windows
lsof -i :5432                  # macOS/Linux

# Kill process đang chiếm port
taskkill /PID [pid] /F         # Windows
kill -9 [pid]                  # macOS/Linux
```

### Prisma migration fail

```bash
# Reset database và chạy lại từ đầu (DEV ONLY)
npx prisma migrate reset

# Kiểm tra connection string
npx prisma db pull
```

### Redis connection refused

```bash
# Kiểm tra Redis container đang chạy
docker ps | grep redis

# Test kết nối
docker exec ray-paradis-redis redis-cli -a redis_pass ping
# Phải trả về: PONG
```

### "Module not found" sau npm install

```bash
# Xóa node_modules và cài lại
rm -rf node_modules
npm install

# Hoặc xóa từng workspace
rm -rf backend/node_modules storefront/node_modules back-office/node_modules ai-service/node_modules
npm install
```
