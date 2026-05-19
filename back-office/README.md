# 🛠️ Operations Back-Office Portal (`@ray-paradis/back-office`)

[English](#english) | [Tiếng Việt](#tiếng-việt)

---

## English

### 1. Overview
The `@ray-paradis/back-office` application is the administrative command center for the Ray Paradis e-commerce platform. Built with **React**, **Vite**, and **Ant Design (Antd)**, it provides internal operations teams, managers, and system administrators with tools to control product catalogs, monitor inventory, manage multi-location fulfillment, audit payment transactions, and dynamically map RBAC/ABAC security configurations.

---

### 2. Core Capabilities
* **📦 Dynamic Catalog Matrix Manager**: Create and organize complex jewelry attributes (metal composition, ring sizing, gem cuts) and bind them to unique physical SKUs (Product Variants).
* **🎫 Order Fulfillment Console**: An interactive, state-machine driven dashboard allowing administrators to move order lifecycles forward (Processing, Shipping, Delivered) or initiate refunds.
* **🛡️ Security & Access Control UI**: A granular control dashboard to map roles, assign permissions, and visually configure Attribute-Based Access Control (ABAC) rules for users.
* **📊 Analytics Dashboard**: Real-time business metrics, sales analytics, and catalog performance tracking built using **Recharts**.
* **⚡ Live Feed Integrations**: Persistent WebSockets connection using **Socket.io-client** to receive real-time alerts on new checkouts, stock drops, or vector database ingestion statuses.

---

### 3. Folder Architecture (Feature-Sliced Design Lite)
We follow a modified **Feature-Sliced Design (FSD)** methodology to enforce unidirectional imports and strictly separate presentation components from business logic:

```text
back-office/src/
├── 📂 app/          # Initializers: Router settings, Antd theme, TanStack Query providers
├── 📂 processes/    # Cross-page business workflows (e.g. multi-step order import guides)
├── 📂 pages/        # Lazy-loaded page route components (Dashboard, Orders, Catalog, Users)
├── 📂 widgets/      # Composition blocks combining features & entities (e.g. OrderTableGrid)
├── 📂 features/     # User interactions yielding data changes (e.g. EditVariantPrice, AssignRole)
├── 📂 entities/     # Domain business modules containing API actions, state stores, and types
│   ├── 📂 order/
│   ├── 📂 product/
│   └── 📂 user/
└── 📂 shared/       # Primitives: Axios client (`apiClient`), helpers, formatting utils
```

---

### 4. Technology Stack
* **UI Foundation**: Ant Design (v5) for high-performance dashboard tables, modals, and input forms.
* **Styling**: Tailwind CSS (v3) for utility grids and responsive alignments.
* **State Management**: Zustand for light-weight client session states.
* **Server State**: TanStack Query (React Query v5) for automatic caching, optimistic updates, and background queries refetching.
* **Bilingual Translation**: i18next for multi-language support.

---

### 5. Running Operations

Before booting the local server, verify you have copy-pasted `.env.example` into `.env` and set the core variables:

```bash
# Install dependencies (if not executed at monorepo root)
npm install

# Boot development environment (vite)
npm run dev

# Run TypeScript checking and compile a production-ready HTML/JS bundle
npm run build

# Preview the built production assets locally
npm run preview
```

* The dev environment runs on `http://localhost:3000` by default.

---

---

## Tiếng Việt

### 1. Tổng quan
Ứng dụng `@ray-paradis/back-office` là trung tâm quản trị vận hành dành cho hệ thống e-commerce Ray Paradis. Được xây dựng dựa trên nền tảng **React**, **Vite**, và thư viện **Ant Design (Antd)**, ứng dụng cung cấp cho các bộ phận vận hành nội bộ, nhà quản trị và đội ngũ kỹ thuật các công cụ để quản lý danh mục sản phẩm, theo dõi kho hàng đa điểm, xử lý đơn hàng, đối soát giao dịch thanh toán và cấu hình phân quyền bảo mật động (RBAC/ABAC).

---

### 2. Các chức năng chính
* **📦 Trình quản lý danh mục thuộc tính động (Catalog Matrix)**: Tạo lập và tổ chức các nhóm thuộc tính trang sức phức tạp (loại kim loại, ni tay nhẫn, giác cắt đá quý) và gán chúng vào các mã SKU vật lý cụ thể (Product Variants).
* **🎫 Bảng điều khiển quy trình đơn hàng (Fulfillment Console)**: Giao diện tương tác điều hướng vòng đời đơn hàng theo mô hình máy trạng thái (Đang xử lý, Đang giao, Đã giao) hoặc kích hoạt hoàn tiền trực tiếp.
* **🛡️ Giao diện phân quyền bảo mật**: Thiết lập chi tiết vai trò (Roles), phân bổ quyền hạn (Permissions) và trực quan hóa các quy tắc kiểm soát truy cập dựa trên thuộc tính (ABAC) cho nhân sự hệ thống.
* **📊 Báo cáo & Thống kê**: Biểu đồ phân tích doanh thu, số lượng bán và hiệu suất danh mục sản phẩm được phát triển bằng thư viện **Recharts**.
* **⚡ Luồng dữ liệu thời gian thực (Live Feed)**: Kết nối liên tục thông qua WebSockets (**Socket.io-client**) để nhận cảnh báo tức thời khi có đơn hàng mới, sụt giảm tồn kho hoặc trạng thái nạp dữ liệu vector AI.

---

### 3. Kiến trúc thư mục (FSD Lite)
Dự án áp dụng phương pháp thiết kế chia lớp **Feature-Sliced Design (FSD)** để đảm bảo luồng import một chiều và tách biệt hoàn toàn giữa giao diện hiển thị và logic nghiệp vụ:

```text
back-office/src/
├── 📂 app/          # Khởi tạo: Cấu hình Router, Theme Antd, TanStack Query provider
├── 📂 processes/    # Các quy trình nghiệp vụ liên trang (Ví dụ: Wizard nhập khẩu sản phẩm đa bước)
├── 📂 pages/        # Các thành phần trang được tải chậm (Dashboard, Orders, Catalog, Users)
├── 📂 widgets/      # Khối giao diện phức hợp kết hợp features & entities (Ví dụ: OrderTableGrid)
├── 📂 features/     # Hành vi tương tác của người dùng thay đổi dữ liệu (Ví dụ: EditVariantPrice, AssignRole)
├── 📂 entities/     # Các thực thể nghiệp vụ chứa API action, Zustand store và định nghĩa kiểu dữ liệu
│   ├── 📂 order/
│   ├── 📂 product/
│   └── 📂 user/
└── 📂 shared/       # Primitives: Axios client (`apiClient`), hàm định dạng dữ liệu dùng chung
```

---

### 4. Công nghệ sử dụng
* **Nền tảng giao diện**: Ant Design (v5) cung cấp các bảng dữ liệu hiệu năng cao, cửa sổ modal và form nhập liệu.
* **Tạo kiểu (Styling)**: Tailwind CSS (v3) hỗ trợ căn chỉnh lưới và bố cục responsive nhanh chóng.
* **Quản lý trạng thái**: Zustand quản lý các phiên làm việc và trạng thái client gọn nhẹ.
* **Trạng thái Server**: TanStack Query (React Query v5) tự động lưu bộ nhớ đệm (caching), cập nhật giao diện trực quan trước (optimistic updates), và đồng bộ dữ liệu chạy ngầm.
* **Đa ngôn ngữ**: i18next hỗ trợ dịch thuật giao diện đa quốc gia.

---

### 5. Hướng dẫn chạy dự án

Trước khi khởi động server local, hãy đảm bảo bạn đã copy file `.env.example` thành `.env` và điền đầy đủ thông tin:

```bash
# Cài đặt thư viện (nếu chưa chạy ở thư mục gốc monorepo)
npm install

# Khởi chạy môi trường phát triển (vite)
npm run dev

# Kiểm tra lỗi TypeScript và biên dịch gói HTML/JS tối ưu hóa cho môi trường Production
npm run build

# Xem thử gói biên dịch Production ngay tại local
npm run preview
```

* Theo cấu hình mặc định, server local sẽ khởi chạy tại `http://localhost:3000`.
