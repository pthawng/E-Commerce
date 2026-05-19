# 🧠 AI Recommendation Microservice (`@ray-paradis/ai-service`)

[English](#english) | [Tiếng Việt](#tiếng-việt)

---

## English

### 1. Overview
The `@ray-paradis/ai-service` is a high-performance, decoupled NestJS microservice that powers the semantic search and personalized product recommendation engine for the e-commerce platform. It integrates with **Google Gemini API** for semantic vector generation and **Qdrant Vector Database** for fast cosine-similarity searches.

---

### 2. Core Capabilities
* **📡 High-Dimensional Vector Embeddings**: Translates product catalog metadata (name, categories, tags, dynamic attributes) into 768-dimensional vectors using Google Gemini (`gemini-embedding-2`).
* **🔍 Semantic Similarity Search**: Performs nearest-neighbor queries against Qdrant Vector DB to find relevant similar products based on catalog characteristics rather than simple keyword matches.
* **⚡ Async Pipeline Processing**: Uses **BullMQ** and **Redis** to run background jobs, ensuring that product updates and bulk vector synchronizations do not block transactional API request cycles.
* **🛡️ API Resilience Guard**: Implements a 3-State **Circuit Breaker** to bypass Gemini calls during API outages, falling back to cached results or popular products. Uses an in-memory **Token Bucket Rate Limiter** and local **LRU Cache** to save Gemini quota costs.

---

### 3. Folder Architecture
The internal layout is structured around decoupled AI modules:

```text
ai-service/src/
├── 📂 api/          # HTTP Controllers exposing embedding syncing & retrieval endpoints
├── 📂 core/         # Shared primitives, custom decorators, and resilience layers
├── 📂 capabilities/ # Reusable AI modules (Semantic search & recommendation engines)
├── 📂 domains/      # Product-specific business logic and orchestrations
├── 📂 integrations/ # External connectors: Gemini Embeddings Client & Qdrant SDK Client
├── 📂 pipelines/    # Background embedding jobs and asynchronous BullMQ workers
├── 📂 common/       # Global middleware, Winston logger settings, and custom error filters
├── 📄 app.module.ts # Central NestJS Module wiring databases, queues, and HTTP controllers
└── 📄 main.ts       # Application bootstraper and validation pipe initializer
```

---

### 4. Technical Stack
* **Framework**: NestJS (v11) for modular dependency injection.
* **Task Queue**: BullMQ & Redis for async background worker orchestration.
* **Database Connectors**: Qdrant SDK and Google Gemini API clients.
* **Observability**: Winston (`nest-winston`) for structured JSON logging and correlation ID tracing.
* **Health Checks**: NestJS Terminus for Kubernetes liveness and readiness probe checks.

---

### 5. Running Operations

Before booting the local server, verify you have copy-pasted `.env.example` into `.env` and set the core variables (including `GEMINI_API_KEY` and `QDRANT_URL`):

```bash
# Start the service in development mode
npm run dev

# Validate TypeScript type compilation without building
npm run typecheck

# Compile TypeScript into optimized JS (dist/)
npm run build

# Boot the compiled package in production mode
npm run start
```

* Defaults to listening on `http://localhost:4000` (or as configured in `.env`).

---

---

## Tiếng Việt

### 1. Tổng quan
Dịch vụ `@ray-paradis/ai-service` là một microservice NestJS độc lập, chịu trách nhiệm vận hành công cụ tìm kiếm ngữ nghĩa và gợi ý sản phẩm cá nhân hóa. Dịch vụ này tích hợp trực tiếp với **Google Gemini API** để tạo vector nhúng ngữ nghĩa (embeddings) và **Qdrant Vector Database** để truy vấn tìm kiếm độ tương đồng cosine (cosine-similarity) nhanh chóng.

---

### 2. Các chức năng chính
* **📡 Tạo Vector nhúng ngữ nghĩa (Embeddings)**: Chuyển đổi siêu dữ liệu sản phẩm (tên, danh mục, nhãn, thuộc tính động) thành các vector 768 chiều bằng Google Gemini (`gemini-embedding-2`).
* **🔍 Tìm kiếm tương đồng ngữ nghĩa**: Thực hiện truy vấn lân cận (nearest-neighbor) trên cơ sở dữ liệu vector Qdrant để tìm các mặt hàng tương đồng dựa trên đặc tính ngữ nghĩa thay vì khớp từ khóa thuần túy.
* **⚡ Xử lý tác vụ ngầm bất đồng bộ**: Sử dụng **BullMQ** và **Redis** để vận hành hàng đợi công việc, đảm bảo việc cập nhật sản phẩm và đồng bộ hóa hàng loạt vector không chặn luồng xử lý API giao dịch.
* **🛡️ Lớp bảo vệ chống lỗi tràn (Resilience)**: Tích hợp **Circuit Breaker** 3 trạng thái để ngắt gọi Gemini API khi gặp lỗi hệ thống, tự động chuyển hướng về kết quả cache hoặc danh sách sản phẩm phổ biến. Sử dụng thuật toán giới hạn tần suất **Token Bucket** và **LRU Cache** tại local để tối ưu chi phí hạn mức gọi API.

---

### 3. Kiến trúc thư mục
Hệ thống được tổ chức phân lớp rõ ràng để quản lý các thành phần logic AI:

```text
ai-service/src/
├── 📂 api/          # HTTP Controllers cung cấp cổng đồng bộ vector & truy vấn gợi ý
├── 📂 core/         # Các primitives dùng chung, decorator tự chế và lớp bảo vệ ngắt mạch (Circuit Breaker)
├── 📂 capabilities/ # Các module logic AI có thể tái sử dụng (Moteur gợi ý & Tìm kiếm ngữ nghĩa)
├── 📂 domains/      # Logic nghiệp vụ cụ thể cho từng kịch bản sản phẩm
├── 📂 integrations/ # Kết nối dịch vụ ngoài: Trình gọi Gemini API & Qdrant SDK Client
├── 📂 pipelines/    # Các tác vụ ngầm tạo vector và worker xử lý hàng đợi BullMQ bất đồng bộ
├── 📂 common/       # Middleware, cấu hình Winston Logger ghi log tập trung, và bộ lọc lỗi
├── 📄 app.module.ts # Module trung tâm kết nối cơ sở dữ liệu, hàng đợi tác vụ và HTTP controllers
└── 📄 main.ts       # File khởi chạy ứng dụng và kích hoạt bộ lọc kiểm tra dữ liệu đầu vào
```

---

### 4. Công nghệ sử dụng
* **Framework**: NestJS (v11) cung cấp cơ chế quản lý Dependency Injection modul hóa.
* **Hàng đợi công việc**: BullMQ & Redis để điều phối worker chạy ngầm.
* **Cơ sở dữ liệu Vector**: Qdrant SDK và trình kết nối Google Gemini API.
* **Ghi nhận vết hệ thống (Observability)**: Winston (`nest-winston`) ghi log định dạng JSON cấu trúc hóa, hỗ trợ bám vết Correlation ID xuyên suốt.
* **Giám sát sức khỏe**: NestJS Terminus cung cấp endpoint kiểm tra tình trạng liveness/readiness cho Kubernetes.

---

### 5. Hướng dẫn chạy dự án

Trước khi chạy server local, hãy đảm bảo bạn đã copy file `.env.example` thành `.env` và điền đầy đủ các khóa truy cập (đặc biệt là `GEMINI_API_KEY` và `QDRANT_URL`):

```bash
# Khởi chạy ứng dụng ở chế độ local development
npm run dev

# Kiểm tra lỗi biên dịch TypeScript không sinh file
npm run typecheck

# Biên dịch mã nguồn TypeScript thành JavaScript tối ưu (thư mục dist/)
npm run build

# Chạy bản biên dịch ở chế độ Production
npm run start
```

* Ứng dụng mặc định chạy tại địa chỉ `http://localhost:4000` (hoặc theo cấu hình cổng trong `.env`).
