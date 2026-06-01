# ADR-005: Vector Search với Qdrant thay vì pgvector

**Trạng thái**: `Accepted`
**Ngày**: 2025-01-01
**Tác giả**: Ray Paradis Engineering

---

## Bối cảnh

Ray Paradis cần tính năng **gợi ý sản phẩm ngữ nghĩa** (semantic similarity search): khách hàng xem một chiếc nhẫn kim cương, hệ thống gợi ý các sản phẩm tương tự dựa trên chất liệu, kiểu dáng, phân khúc giá — không chỉ dựa trên tag/category đơn thuần.

Cần lựa chọn nơi lưu trữ và tìm kiếm vector embeddings (768 chiều từ Google Gemini `gemini-embedding-2`).

---

## Quyết định

Sử dụng **Qdrant** là Vector Database chuyên biệt, tách biệt hoàn toàn khỏi PostgreSQL.

Pipeline:
```
[Product Created/Updated]
    │
    ▼
[ai-service — BullMQ Worker]
    │── 1. Generate embedding: Gemini API → float[768]
    │── 2. Upsert vào Qdrant collection `products`
    │       payload: { productId, name, category, priceRange, metalType }
    └── 3. Cache embedding trong Redis (24h TTL) để tránh gọi Gemini lại
         │
         ▼
[Storefront — Recommendation Request]
    │── 1. Gửi productId tới ai-service
    │── 2. ai-service query Qdrant: cosine similarity, top-10
    └── 3. Return danh sách productId gợi ý → backend fetch chi tiết từ PostgreSQL
```

Bảo vệ Gemini API:
- **LRU Cache** (1000 items): tránh re-embed sản phẩm không thay đổi
- **Token Bucket Rate Limiter**: giới hạn 60 request/phút theo quota Gemini
- **3-State Circuit Breaker**: `CLOSED → OPEN → HALF_OPEN` — khi Gemini lỗi liên tục, fallback về keyword search

---

## Hệ quả (Consequences)

**Tích cực:**
- ✅ **Hiệu suất**: Qdrant được tối ưu riêng cho HNSW index (cosine similarity search trên triệu vectors)
- ✅ **Payload filtering**: Qdrant cho phép filter `metalType = 'GOLD' AND priceRange < 50M` trước khi rank similarity
- ✅ **Process isolation**: AI service là separate process — tải tính toán không ảnh hưởng API chính
- ✅ **Resilience**: Circuit breaker đảm bảo API chính vẫn hoạt động khi Gemini/Qdrant down

**Tiêu cực / Trade-off:**
- ⚠️ **Thêm một service cần maintain**: Qdrant container trong Docker Compose, cần backup vector data riêng
- ⚠️ **Eventual consistency**: Khi product được update, vector cần vài giây để sync qua BullMQ
- ⚠️ **Cost**: Gemini embedding API có quota và cost — phải monitor usage

---

## Phương án đã loại bỏ

### pgvector (PostgreSQL extension)
**Lý do loại bỏ**: pgvector chậm hơn đáng kể với tập dữ liệu lớn (>100K vectors). Đặc biệt, không có payload-based pre-filtering hiệu quả như Qdrant HNSW. Thêm tải vào PostgreSQL instance chính.

### Elasticsearch với dense_vector
**Lý do loại bỏ**: Overhead lớn (JVM, memory), setup phức tạp hơn. Overkill cho use case recommendation đơn thuần khi Qdrant nhẹ và focused hơn.

### OpenAI Embeddings
**Lý do loại bỏ**: Google Gemini API tích hợp tốt hơn với hạ tầng GCP, quota và pricing phù hợp hơn. `gemini-embedding-2` cho chất lượng tốt cho Vietnamese text trong product descriptions.

---

## Liên quan

- [`ai-service/src/`](file:///e:/Ray%20Paradis/ai-service/src) — Implementation pipeline
- [AI Pipeline Architecture](../ai-pipeline.md) — Mô tả chi tiết circuit breaker và cache strategy
- [ADR-004: Outbox Pattern](./004-outbox-pattern.md) — Trigger embedding generation qua BullMQ
