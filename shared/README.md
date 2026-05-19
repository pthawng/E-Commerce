# 📦 Shared Contracts (`@ecommerce/shared`)

[English](#english) | [Tiếng Việt](#tiếng-việt)

---

## English

### 1. Overview
The `@ecommerce/shared` package is the single source of architectural truth for data models, validation schemas, and common configurations across the monorepo workspace. It guarantees type safety, validation consistency, and prevents contract drift between the backend api services, storefront, and administrative portals.

### 2. Layout Structure
```text
shared/
├── 📂 src/
│   ├── 📂 DTO/          # Data Transfer Objects for API request/response payloads
│   ├── 📂 config/       # Shared configurations and environment contracts
│   ├── 📂 constants/    # Fixed system variables, layout sizes, and flags
│   ├── 📂 enums/        # Global domain enums (e.g. OrderStatus, PaymentStatus)
│   ├── 📂 types/        # Pure TypeScript models representing relational schema entities
│   ├── 📂 utils/        # Generic helper functions and formatting utilities
│   ├── 📂 validation/   # Zod validation schemas for cross-boundary validation
│   └── 📄 index.ts      # Main barrel export file (Single Entry Point)
├── 📄 package.json      # Dual-packaging and module export configurations
├── 📄 tsconfig.json     # Shared TypeScript compilation settings
└── 📄 tsup.config.ts    # Bundler config for outputting ESM (.mjs) and CJS (.js)
```

### 3. Architecture Decisions (GCP-Ready)
* **Zero Runtime Overhead**: The majority of output compiled code is pure TypeScript types which disappear after transpilation. Only Enums, Zod schemas, and utility helper functions generate compiled JS output.
* **Dual ESM/CJS Compilation**: Using `tsup`, the library is built for both CommonJS (`dist/index.js`) and ES Modules (`dist/index.mjs`). This ensures compatibility with the Vite storefront (which requires ESM) and NestJS services.
* **Declarative Validation**: Zod is the primary validation engine. We extract TypeScript interfaces directly from Zod models (`z.infer<typeof Schema>`) to avoid double-declaring models.

### 4. How to Use & Import
All exports are exposed through a singular entry point. Import objects directly from the package namespace:

```typescript
import { OrderStatus } from '@ecommerce/shared';
import { checkoutSchema } from '@ecommerce/shared';
import type { IProductVariant } from '@ecommerce/shared';
```

### 5. Onboarding & Running Operations
When shared files are modified, you must rebuild the library for the consumer services to detect change structures:

```bash
# Clean previous builds
npm run clean

# Compile the library into dist/ using tsup
npm run build

# Watch mode for hot-reload during active development
npm run watch
```

---

## Tiếng Việt

### 1. Tổng quan
Thư viện `@ecommerce/shared` đóng vai trò là "nguồn chân lý" (Single Source of Truth) duy nhất về mặt cấu trúc dữ liệu, schema xác thực, và cấu hình dùng chung trong toàn bộ hệ thống monorepo. Thư viện này bảo đảm an toàn kiểu dữ liệu (type safety), tính nhất quán khi xác thực dữ liệu, và ngăn ngừa sự lệch pha hợp đồng API giữa Backend API, Storefront, và Admin Portal.

### 2. Cấu trúc thư mục
```text
shared/
├── 📂 src/
│   ├── 📂 DTO/          # Các đối tượng truyền dữ liệu (Data Transfer Objects) cho API
│   ├── 📂 config/       # Cấu hình dùng chung và các định dạng tham số môi trường
│   ├── 📂 constants/    # Các biến hệ thống cố định, kích thước giao diện, cờ trạng thái
│   ├── 📂 enums/        # Các enum nghiệp vụ toàn cục (ví dụ: OrderStatus, PaymentStatus)
│   ├── 📂 types/        # Định nghĩa kiểu TypeScript thuần túy ánh xạ từ cơ sở dữ liệu
│   ├── 📂 utils/        # Các hàm tiện ích dùng chung và định dạng dữ liệu
│   ├── 📂 validation/   # Zod schema dùng để kiểm tra dữ liệu ở cả front và back
│   └── 📄 index.ts      # File barrel export chính (Cổng xuất duy nhất)
├── 📄 package.json      # Cấu hình dual-packaging và đóng gói xuất bản module
├── 📄 tsconfig.json     # Cấu hình biên dịch TypeScript dùng chung
└── 📄 tsup.config.ts    # Cấu hình đóng gói tsup tạo ra định dạng ESM (.mjs) và CJS (.js)
```

### 3. Quyết định kiến trúc (Chuẩn GCP-Ready)
* **Không tốn tài nguyên runtime (Zero Runtime Overhead)**: Phần lớn code sau biên dịch là các kiểu định nghĩa TypeScript sẽ bị loại bỏ hoàn toàn. Chỉ có Enums, Zod schemas và các hàm tiện ích mới sinh ra code JavaScript chạy runtime.
* **Biên dịch kép ESM/CJS (Dual Compilation)**: Sử dụng `tsup` để đóng gói thư viện đồng thời sang định dạng CommonJS (`dist/index.js`) và ES Modules (`dist/index.mjs`). Điều này đảm bảo thư viện chạy mượt mà trên cả môi trường Vite của Storefront (yêu cầu ESM) lẫn backend NestJS.
* **Khai báo xác thực tập trung**: Zod được chọn làm bộ công cụ xác thực dữ liệu chính. Định nghĩa kiểu dữ liệu TypeScript được suy luận trực tiếp từ schema của Zod (`z.infer<typeof Schema>`) để tránh việc khai báo lặp lại.

### 4. Cách sử dụng & Import
Tất cả các thành phần được xuất ra qua một cổng xuất duy nhất. Import trực tiếp từ namespace của thư viện:

```typescript
import { OrderStatus } from '@ecommerce/shared';
import { checkoutSchema } from '@ecommerce/shared';
import type { IProductVariant } from '@ecommerce/shared';
```

### 5. Vận hành & Hướng dẫn phát triển
Mỗi khi chỉnh sửa cấu trúc types hoặc schema trong thư mục `shared`, bạn cần chạy build lại thư viện để các ứng dụng tiêu thụ nhận diện được cấu trúc mới:

```bash
# Xóa bản build cũ
npm run clean

# Biên dịch thư viện vào thư mục dist/ bằng tsup
npm run build

# Chạy chế độ watch tự động biên dịch lại khi sửa file lúc phát triển
npm run watch
```
