## AI Service

Scaffold for the dedicated AI microservice.

### Layout

- `src/core`: shared AI primitives
- `src/capabilities`: reusable AI engines such as search and recommendation
- `src/domains`: use-case specific orchestration for storefront and back-office
- `src/integrations`: external AI and vector providers
- `src/pipelines`: async/background jobs
- `src/api`: HTTP-facing controllers
- `src/config`: service configuration
- `src/common`: shared helpers and types

### Layering Rule

- `core` owns primitives
- `capabilities` owns reusable AI logic
- `domains` composes capabilities for product use-cases

### Similar Products Flow

1. Product created or updated
2. Embedding pipeline builds semantic text and generates vector
3. Vector is upserted into Qdrant with product payload
4. Recommendation capability fetches the source vector and searches nearest neighbors
5. API returns recommendations to backend/storefront
6. Cache key format: `recommend:{productId}`
7. If AI fails, caller should fall back to popular products
