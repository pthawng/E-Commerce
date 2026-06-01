# API Reference — Rate Limiting

## Giới hạn Request

Ray Paradis áp dụng rate limiting để bảo vệ API:

| Endpoint group | Giới hạn | Window |
|---------------|---------|--------|
| Auth endpoints (`/api/auth/*`) | 10 requests | 1 phút |
| Public storefront API | 100 requests | 1 phút |
| Admin API (`/api/admin/*`) | 200 requests | 1 phút |
| Webhook endpoints | Không giới hạn | - |
| AI search (`/api/search/*`) | 30 requests | 1 phút |

## Response khi vượt giới hạn

```
HTTP 429 Too Many Requests
Retry-After: 45

{
  "statusCode": 429,
  "message": "Too many requests, please wait before retrying",
  "error": "Too Many Requests"
}
```

## Xử lý trong Frontend

```typescript
// Tự động retry sau khi hết rate limit window
if (error.response?.status === 429) {
  const retryAfter = error.response.headers['retry-after'] ?? 60;
  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  return retry(request);
}
```
