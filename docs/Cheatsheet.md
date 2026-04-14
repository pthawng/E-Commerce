# 🚀 Ray Paradis - Lệnh Vận Hành Dự Án

Tài liệu tra cứu nhanh các lệnh làm việc với Backend và Database.

---

## 💻 1. Môi trường LOCAL (Docker)
Sử dụng file cấu hình: `.env.development`

### 🐳 Quản lý Docker (Database & Redis)
*Chạy tại thư mục gốc của dự án*
- **Khởi động**: `docker compose -f database/compose.dev.yaml up -d`
- **Tắt**: `docker compose -f database/compose.dev.yaml down`
- **Xóa sạch Volume (Dữ liệu DB)**: `docker compose -f database/compose.dev.yaml down -v`

### 🛠 Thao tác Database Local
*Chạy tại thư mục `backend`*
- **Cài đặt ban đầu (Migrate)**: `npm run prisma:migrate:dev`
- **Đổ dữ liệu mẫu (Unique Images)**: `npm run seed`
- **Xóa sạch dữ liệu (Reset)**: `npm run db:reset`
- **Mở giao diện xem DB**: `npx prisma studio`

### 🚀 Chạy ứng dụng (Server)
*Chạy tại thư mục `backend`*
- **Chế độ Phát triển (Dev)**: `npm run start:dev`  
  *(Tự động load code mới khi bạn lưu file)*
- **Chế độ Debug**: `npm run start:debug`


---

## 🌐 2. Môi trường PRODUCTION (Render.com)
Sử dụng file cấu hình: `.env.production` (kết nối qua `dotenv-cli`)

### ⚠️ Lệnh Cực Kỳ Cẩn Trọng
*Chạy tại thư mục `backend`*
- **Xem Database Online**: `npm run prisma:studio:prod`
- **Cập nhật cấu trúc bảng (Deploy)**: `npm run prisma:migrate:prod:local`
- **Xóa và nạp lại từ đầu (Reset - Nguy hiểm)**: `npm run db:reset:prod`

---

## 🔑 3. Công cụ & Tiện ích
*Chạy tại thư mục `backend`*

### 📧 Gmail OAuth2
- **Lấy Refresh Token**: `npm run get:gmail-token`
  *(Dùng khi bạn muốn thay đổi tài khoản gửi Mail hoặc Token hết hạn)*

### 🏗 Cấu trúc Project
- **Cập nhật Prisma Client**: `npm run prisma:generate`
- **Xây dựng bản Prod (Build)**: `npm run build`
- **Chạy bản Build**: `npm run start:prod`

---

## 💡 Lưu ý bảo mật
1. **IP Whitelist**: Khi dùng các lệnh `:prod`, hãy đảm bảo IP của bạn đã được thêm vào mục **Access Control** trên Dashboard của Render/PostgreSQL.
2. **File .env**: Không bao giờ commit file `.env.production` lên Git.
