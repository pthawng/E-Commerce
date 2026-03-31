# Error Handling Contract

This document defines the standardized business error codes returned by the Ray Paradis backend. These codes allow the storefront to provide specific, user-friendly feedback instead of generic error messages.

## Response Structure
All errors follow this envelope:
```json
{
  "success": false,
  "statusCode": 409,
  "message": "Insufficient stock",
  "path": "/api/order",
  "timestamp": "2024-03-31T09:48:12Z",
  "code": "STOCK_INSUFFICIENT" // <--- Mandatory for business errors
}
```

## Inventory Errors
| Code | HTTP Status | Description |
| --- | --- | --- |
| `STOCK_INSUFFICIENT` | 409 (Conflict) | Total available stock across warehouses was less than requested. |
| `VARIANT_INACTIVE` | 400 (Bad Request) | The product variant is no longer active in the catalog. |
| `RESERVATION_EXPIRED` | 410 (Gone) | The temporary inventory reservation has timed out. |

## Commerce & Checkout Errors
| Code | HTTP Status | Description |
| --- | --- | --- |
| `CART_HASH_MISMATCH` | 409 (Conflict) | Cart content changed since the `checkoutToken` was issued. |
| `IDEMPOTENCY_KEY_DUPLICATE` | 409 (Conflict) | An order with the same JTI / Idempotency-Key already exists. |
| `PAYMENT_GATEWAY_FAILURE` | 502 (Bad Gateway) | Could not initiate the link with VNPAY/PayPal. |

## Authentication Errors
| Code | HTTP Status | Description |
| --- | --- | --- |
| `SESSION_HIJACK_DETECTED` | 403 (Forbidden) | Request User-Agent mismatch (Session Binding violation). |
| `TOKEN_EXPIRED` | 401 (Unauthorized) | The JWT has expired. |
| `CSRF_TOKEN_MISSING` | 403 (Forbidden) | The `x-csrf-token` header was missing or invalid. |
