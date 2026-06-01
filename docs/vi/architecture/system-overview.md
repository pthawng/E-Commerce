# Kiến trúc Hệ thống — Tổng quan

## Sơ đồ Tổng thể

```mermaid
graph TD
    subgraph Clients
        SF[Storefront<br/>React + Vite]
        BO[Back-Office<br/>React + Ant Design]
    end

    subgraph Core["Backend API (NestJS Modular Monolith)"]
        GW[API Gateway<br/>Guards + Validation]
        AUTH[Auth Module]
        RBAC[RBAC Module]
        ORDER[Order Module]
        PAY[Payment Module]
        INV[Inventory Module]
        PROD[Product Module]
        OUTBOX[Domain Event Outbox]
    end

    subgraph Queue["BullMQ Workers"]
        IW[Inventory Worker]
        MW[Mail Worker]
        AW[Analytics Worker]
    end

    subgraph AI["AI Service (NestJS)"]
        AIS[AI Service]
        CB[Circuit Breaker]
        LRU[LRU Cache]
    end

    subgraph Storage
        PG[(PostgreSQL<br/>Primary DB)]
        REDIS[(Redis<br/>Cache + Queues)]
        QDRANT[(Qdrant<br/>Vector DB)]
    end

    subgraph External
        VNPAY[VNPay]
        PAYPAL[PayPal]
        GEMINI[Google Gemini API]
    end

    SF -->|HTTPS + Cookie| GW
    BO -->|HTTPS + Cookie| GW
    GW --> AUTH
    GW --> RBAC
    GW --> ORDER
    GW --> PAY
    GW --> INV
    GW --> PROD

    AUTH -->|Cache permissions| REDIS
    RBAC -->|Cache permissions| REDIS

    ORDER --> PG
    ORDER --> OUTBOX
    PAY --> PG
    PAY -->|IPN| VNPAY
    PAY -->|Webhook| PAYPAL
    INV -->|Row lock| PG
    OUTBOX --> REDIS

    REDIS --> IW
    REDIS --> MW
    REDIS --> AW

    GW -->|Internal token| AIS
    AIS --> CB
    CB --> GEMINI
    AIS --> LRU
    AIS --> QDRANT
```

---

## Luồng Checkout (Critical Path)

```mermaid
sequenceDiagram
    participant SF as Storefront
    participant API as Backend
    participant PG as PostgreSQL
    participant Redis
    participant VNPay

    SF->>API: POST /api/orders {items}
    API->>PG: BEGIN TRANSACTION
    API->>PG: SELECT inventory_balances FOR UPDATE NOWAIT
    API->>PG: UPDATE reservedQuantity += n
    API->>PG: INSERT Order (PENDING)
    API->>PG: COMMIT
    API-->>SF: {orderId, paymentUrl}

    SF->>VNPay: Redirect to payment page
    VNPay->>API: POST /api/webhooks/vnpay (IPN)
    API->>API: Verify HMAC signature
    API->>PG: BEGIN TRANSACTION
    API->>PG: UPDATE Order → CONFIRMED
    API->>PG: INSERT domain_event_outbox
    API->>PG: COMMIT
    API-->>VNPay: 200 RspCode=00

    Note over Redis: BullMQ worker picks up event
    Redis->>PG: Deduct reservedQuantity
    Redis->>Redis: Send confirmation email job
```

---

## Quyết định Kiến trúc Quan trọng

| Quyết định | Tham khảo |
|-----------|-----------|
| Tại sao Modular Monolith? | [ADR-001](./adr/001-modular-monolith.md) |
| Tại sao HTTP-Only Cookie? | [ADR-002](./adr/002-http-only-cookie-auth.md) |
| Tại sao Pessimistic Locking? | [ADR-003](./adr/003-inventory-locking-strategy.md) |
| Tại sao Outbox Pattern? | [ADR-004](./adr/004-outbox-pattern.md) |
| Tại sao Qdrant thay vì pgvector? | [ADR-005](./adr/005-vector-search-qdrant.md) |
