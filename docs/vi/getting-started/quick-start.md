# Quick Start — Khởi chạy Ray Paradis

> Từ `git clone` đến app chạy trong dưới 15 phút. Chi tiết hơn xem: [Local Development](../operations/local-dev.md)

## Yêu cầu: Node.js 20+, Docker Desktop

```bash
# 1. Clone repository
git clone https://github.com/[your-org]/ray-paradis.git
cd ray-paradis

# 2. Khởi động infrastructure (PostgreSQL, Redis, Qdrant, Mailpit)
docker compose -f infra/docker-compose.dev.yml up -d

# 3. Cài đặt dependencies toàn workspace
npm install

# 4. Setup database
cd backend
npx prisma migrate dev
npx prisma db seed
cd ..

# 5. Chạy tất cả services
npm run dev
```

## Sau khi chạy xong

| URL | Service |
|-----|---------|
| `http://localhost:5173` | Storefront |
| `http://localhost:3000` | Back-Office |
| `http://localhost:4000/api/docs` | Swagger API Docs |
| `http://localhost:8025` | Mailpit (email catcher) |

**Đăng nhập Back-Office:**
- Email: `admin@rayparadis.com`
- Password: `Admin@123`

## Bước tiếp theo

- [Cấu hình environment variables →](./environment-setup.md)
- [Hiểu cấu trúc project →](./project-structure.md)
- [Đọc coding conventions →](../development/coding-conventions.md)
