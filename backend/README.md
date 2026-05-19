# ⚙️ Core Commerce Backend API (`@ray-paradis/backend`)

[English](#english) | [Tiếng Việt](#tiếng-việt)

---

## English

### 1. Overview
The `@ray-paradis/backend` application is the core transaction processing engine, business logic layer, and primary source of truth for the Ray Paradis platform. Built on **NestJS** and **Prisma ORM**, it manages database consistency, processes order workflows, orchestrates inventory allocations, and enforces secure user sessions and RBAC/ABAC authorization checks.

---

### 2. Core Capabilities
* **🔒 Concurrency Guard & Row Locks**: Employs PostgreSQL row locks (`SELECT FOR UPDATE NOWAIT`) and an automated **Exponential Backoff Retry** mechanism to prevent overselling on hot-SKUs and avoid DB pool exhaustion.
* **⚡ Sub-10ms Active Authorization**: User permissions are cached in Redis as flat arrays, bypassing expensive PostgreSQL multi-table joins on every incoming HTTP call.
* **📬 Event-Driven Decoupling**: Implements the **Transactional Outbox Pattern** to write events (like inventory deduction) to an `Outbox` table in the same transaction as order creation. A background queue processor ensures eventual consistency without delaying checkout response times.
* **🛡️ Security Hardening**: Enforces Double Submit Cookie pattern for CSRF protection, HttpOnly/SameSite cookies for JWT session validation, and intercepts direct database mutation attempts outside authorized service classes using a custom **Prisma Invariant Guard**.

---

### 3. Folder Architecture
The NestJS project is structured into domain-specific modules:

```text
backend/src/
├── 📂 modules/       # Encapsulated Business Modules
│   ├── 📂 auth/      # JWT authentication, session binding, and password recovery
│   ├── 📂 rbac/      # Role-Based Access Control and Permission mapping
│   ├── 📂 catalog/   # Product, Dynamic Attribute, and Variant models
│   ├── 📂 inventory/ # Multi-warehouse stock tracking, reservations, and logs
│   ├── 📂 order/     # Order timeline state-machine and Outbox event dispatches
│   └── 📂 payment/   # Idempotent gateway transaction registers and webhooks
├── 📂 common/        # Shared middleware (Correlation IDs), decorators, and filters
├── 📂 prisma/        # Database schema models, seed files, and migration scripts
├── 📄 main.ts        # Server entry point, CORS settings, and validator configs
└── 📄 app.module.ts  # Master application module resolving global dependencies
```

---

### 4. Technical Stack
* **Framework**: NestJS (v10) for structured server architectures.
* **Database & ORM**: PostgreSQL (v16) managed via Prisma ORM.
* **Cache & Locks**: Redis (v7) integrated using `ioredis` for permissions caching, API throttles, and checkout pre-checks.
* **Task Queues**: BullMQ for processing Outbox messages asynchronously.

---

### 5. Running Operations

Before starting, copy `.env.example` into `.env` and configure your credentials (e.g. `DATABASE_URL`, `REDIS_HOST`, `JWT_ACCESS_SECRET`):

```bash
# Start local server in hot-reload development mode
npm run start:dev

# Run database migrations and generate the updated Prisma Client
npm run prisma:migrate:dev

# Seed initial database records (roles, taxonomy attributes)
npm run seed

# Build the optimized production bundle (dist/)
npm run build

# Start the compiled bundle in production mode
npm run start:prod
```

* Defaults to listening on `http://localhost:4000`.

---

---

## Tiếng Việt

### 1. Tổng quan
Ứng dụng `@ray-paradis/backend` là lõi xử lý giao dịch, tầng nghiệp vụ chính và là nguồn chân lý dữ liệu (Source of Truth) của hệ thống Ray Paradis. Được phát triển trên nền tảng **NestJS** và **Prisma ORM**, ứng dụng chịu trách nhiệm quản trị tính nhất quán dữ liệu, xử lý vòng đời đơn hàng, điều phối phân bổ kho hàng, bảo mật phiên làm việc và kiểm tra quyền truy cập (RBAC/ABAC) của người dùng.

---

### 2. Các chức năng chính
* **🔒 Chống trùng lặp & Khóa dòng**: Áp dụng cơ chế khóa dòng PostgreSQL (`SELECT FOR UPDATE NOWAIT`) kết hợp giải thuật **Thử lại với thời gian chờ tăng dần (Exponential Backoff)** để ngăn ngừa bán vượt tồn kho (overselling) đối với các sản phẩm hot mà không làm treo hàng đợi kết nối DB.
* **⚡ Phân quyền hiệu năng cao (Sub-10ms)**: Toàn bộ danh sách quyền hạn của tài khoản đăng nhập được làm phẳng và lưu ở Redis, bỏ qua việc thực hiện truy vấn JOIN nhiều bảng trong Postgres trên mỗi request.
* **📬 Khử liên kết bất đồng bộ (Outbox Pattern)**: Triển khai mô hình **Transactional Outbox Pattern** để ghi nhận các sự kiện nghiệp vụ (như trừ kho) vào bảng `Outbox` ngay trong cùng transaction tạo đơn hàng. Worker chạy ngầm sau đó sẽ xử lý hàng đợi này nhằm bảo đảm tính nhất quán sau cùng (Eventual Consistency).
* **🛡️ Bảo mật nghiêm ngặt (Hardening)**: Áp dụng Double Submit Cookie để phòng chống tấn công CSRF, lưu trữ token phiên trong cookie bảo mật HttpOnly/SameSite. Đặc biệt sử dụng **Prisma Invariant Guard** tùy chỉnh để tự động chặn các thao tác sửa đổi database trái phép từ bên ngoài lớp Service được chỉ định.

---

### 3. Kiến trúc thư mục
Dự án NestJS được modul hóa rõ ràng theo các miền nghiệp vụ riêng biệt:

```text
backend/src/
├── 📂 modules/       # Các Module Nghiệp vụ Độc lập
│   ├── 📂 auth/      # Xác thực người dùng, liên kết phiên JWT và khôi phục mật khẩu
│   ├── 📂 rbac/      # Phân quyền người dùng (Role-Based Access Control) và ánh xạ quyền
│   ├── 📂 catalog/   # Định nghĩa sản phẩm, thuộc tính động và các biến thể biến đổi
│   ├── 📂 inventory/ # Quản lý tồn kho đa điểm, giữ hàng tạm thời (Reservation) và lịch sử kho
│   ├── 📂 order/     # Máy trạng thái đơn hàng (State-machine) và phát sự kiện Outbox ngầm
│   └── 📂 payment/   # Ghi nhận giao dịch tài chính độc lập và bắt webhook từ VNPay/PayPal
├── 📂 common/        # Middleware (Correlation ID bám vết), decorator tùy biến và bộ lọc lỗi
├── 📂 prisma/        # Định nghĩa bảng dữ liệu (Schema), file seed dữ liệu và mã migration
├── 📄 main.ts        # Điểm chạy máy chủ, cấu hình CORS và bộ lọc kiểm tra dữ liệu đầu vào
└── 📄 app.module.ts  # Module tổng thể kết nối toàn bộ hệ thống dependencies
```

---

### 4. Công nghệ sử dụng
* **Framework**: NestJS (v10) định hình kiến trúc máy chủ vững chắc.
* **Cơ sở dữ liệu & ORM**: PostgreSQL (v16) thông qua Prisma ORM.
* **Bộ nhớ đệm & Khóa**: Redis (v7) kết hợp thư viện `ioredis` để cache phân quyền, giới hạn tần suất gọi API và khóa kiểm tra trước khi thanh toán.
* **Hàng đợi xử lý**: BullMQ để quét và thực thi các sự kiện Outbox bất đồng bộ.

---

### 5. Hướng dẫn chạy dự án

Trước khi khởi động, hãy sao chép file `.env.example` thành `.env` và thiết lập các biến môi trường thiết yếu (như `DATABASE_URL`, `REDIS_HOST`, `JWT_ACCESS_SECRET`):

```bash
# Khởi chạy server local ở chế độ tự động tải lại (hot-reload)
npm run start:dev

# Cập nhật cấu trúc bảng dữ liệu database và cập nhật Prisma Client
npm run prisma:migrate:dev

# Đổ dữ liệu thiết lập ban đầu (vai trò phân quyền, danh mục thuộc tính trang sức)
npm run seed

# Biên dịch mã nguồn thành JavaScript tối ưu (thư mục dist/)
npm run build

# Khởi chạy bản biên dịch ở chế độ Production
npm run start:prod
```

* Máy chủ mặc định chạy tại địa chỉ `http://localhost:4000`.
