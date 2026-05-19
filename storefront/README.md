# 🛍️ Headless Storefront Application (`@ray-paradis/storefront`)

[English](#english) | [Tiếng Việt](#tiếng-việt)

---

## English

### 1. Overview
The `@ray-paradis/storefront` is the consumer-facing Single Page Application (SPA) for the Ray Paradis luxury e-commerce platform. Built with **React**, **Vite**, and **Tailwind CSS**, it is designed around a premium "Quiet Atelier" aesthetic, prioritizing sub-second Largest Contentful Paint (LCP), smooth 60fps micro-animations, and client-side server-state caching via TanStack Query.

---

### 2. Core Capabilities
* **💎 Dynamic Variant Configuration**: Interactive configuration loops that handle combinations of metals, sizes, and gem cuts, instantly updating high-definition media carousels.
* **⚡ Optimistic Cart Syncer**: Local-first cart storage synchronized to the backend via TanStack Query, showing instant cart count increments for better UX.
* **🛡️ Zero-Trust Security**: Standardized token lifecycle management using HttpOnly, SameSite secure cookies to prevent XSS. It automatically appends CSRF validation headers using the Double Submit Cookie pattern. (See [FRONTEND_SECURITY.md](./FRONTEND_SECURITY.md) for details).
* **🔄 Payment Return Orchestrator**: Safely handles redirections back from VNPay/PayPal by polling the secure backend API (`GET /payment/status/:orderId`) rather than relying on insecure URL parameters.

---

### 3. Folder Architecture (Feature-Sliced Design)
The client project strictly follows the **Feature-Sliced Design (FSD)** architecture:

```text
storefront/src/
├── 📂 app/          # App Shell: Entry points (main.tsx), styles, router paths, provider chains
├── 📂 pages/        # Lazy-loaded screen components (Home, Catalog, ProductDetails, Checkout, Profile)
├── 📂 widgets/      # Composite UI layouts (e.g. Header, Footer, ImageGallery)
├── 📂 features/     # User actions (e.g. AddToCart, FilterCatalog, AuthenticateCustomer)
├── 📂 entities/     # Domain business components and state stores (e.g. ProductCard, CartStore)
└── 📂 shared/       # Primitives: UI buttons, custom Axios client (`apiClient`), helper hooks
```

---

### 4. Technical Stack
* **UI & Animations**: Tailwind CSS (v3) combined with Radix UI primitives and Framer Motion.
* **State Management**: Zustand for local-first UI states.
* **Server Caching**: TanStack Query (v5) for stale-while-revalidate data fetching.
* **Data Typing**: Shared TypeScript definitions directly imported from the `@ecommerce/shared` package.
* **E2E Testing**: Playwright configuration for browser-level workflow verification.

---

### 5. Running Operations

```bash
# Boot the storefront in development mode
npm run dev

# Audit code formatting and linting rules
npm run lint

# Compile and build the optimized production package (dist/)
npm run build

# Preview the production-built bundle locally
npm run preview
```

* Defaults to running on `http://localhost:5173`.

---

---

## Tiếng Việt

### 1. Tổng quan
Ứng dụng `@ray-paradis/storefront` là giao diện khách hàng (Single Page Application - SPA) của hệ thống thương mại điện tử trang sức xa xỉ Ray Paradis. Được phát triển bằng **React**, **Vite** và **Tailwind CSS**, ứng dụng được tối ưu hóa theo ngôn ngữ thiết kế tối giản "Quiet Atelier", chú trọng vào thời gian hiển thị nội dung lớn nhất cực nhanh (LCP), chuyển động mượt mà 60fps và cơ chế lưu trữ đệm phản hồi từ server bằng TanStack Query.

---

### 2. Các chức năng chính
* **💎 Cấu hình biến thể sản phẩm động**: Giao diện tương tác trực quan cho phép khách hàng kết hợp các loại chất liệu, kích thước ni tay nhẫn và giác cắt đá quý, lập tức cập nhật hình ảnh độ nét cao.
* **⚡ Đồng bộ hóa giỏ hàng Optimistic**: Giỏ hàng lưu trữ ưu tiên ở local và đồng bộ ngầm với backend qua TanStack Query, tăng số lượng hiển thị ngay lập tức để tối ưu trải nghiệm (UX).
* **🛡️ Bảo mật Zero-Trust**: Quản lý vòng đời token qua cookie HttpOnly, SameSite an toàn để phòng chống tấn công XSS. Tự động đính kèm mã bảo mật CSRF qua cơ chế Double Submit Cookie (Chi tiết tại [FRONTEND_SECURITY.md](./FRONTEND_SECURITY.md)).
* **🔄 Điều phối kết quả thanh toán**: Nhận diện phản hồi chuyển hướng từ cổng VNPay/PayPal, thực hiện gọi API kiểm tra trạng thái thực tế từ backend (`GET /payment/status/:orderId`) thay vì tin tưởng các tham số không an toàn trên URL.

---

### 3. Kiến trúc thư mục (Feature-Sliced Design)
Dự án áp dụng chặt chẽ kiến trúc thiết kế chia lớp **Feature-Sliced Design (FSD)**:

```text
storefront/src/
├── 📂 app/          # Khung ứng dụng: File khởi chạy (main.tsx), styles toàn cục, định tuyến router
├── 📂 pages/        # Các trang được tải chậm (Home, Catalog, ProductDetails, Checkout, Profile)
├── 📂 widgets/      # Bố cục giao diện phức hợp (Ví dụ: Header, Footer, ImageGallery)
├── 📂 features/     # Hành động của người dùng (Ví dụ: AddToCart, FilterCatalog, AuthenticateCustomer)
├── 📂 entities/     # Thực thể nghiệp vụ và Zustand store liên quan (Ví dụ: ProductCard, CartStore)
└── 📂 shared/       # Primitives: Nút bấm UI, Axios client tùy chỉnh (`apiClient`), hooks tiện ích
```

---

### 4. Công nghệ sử dụng
* **Giao diện & Chuyển động**: Tailwind CSS (v3) phối hợp cùng Radix UI primitives và Framer Motion.
* **Quản lý trạng thái**: Zustand quản lý trạng thái giao diện local.
* **Bộ nhớ đệm dữ liệu**: TanStack Query (v5) đồng bộ dữ liệu server theo cơ chế stale-while-revalidate.
* **Kiểu dữ liệu**: Nhập trực tiếp các định nghĩa TypeScript từ package chung `@ecommerce/shared`.
* **Kiểm thử E2E**: Tích hợp Playwright để tự động kiểm thử toàn trình trên trình duyệt.

---

### 5. Hướng dẫn chạy dự án

```bash
# Khởi chạy storefront ở chế độ local development
npm run dev

# Kiểm tra lỗi định dạng code và quy tắc lint
npm run lint

# Biên dịch gói sản phẩm tối ưu hóa cho môi trường Production (thư mục dist/)
npm run build

# Xem thử gói biên dịch Production ngay tại local
npm run preview
```

* Ứng dụng mặc định chạy tại địa chỉ `http://localhost:5173`.
