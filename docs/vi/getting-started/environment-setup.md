# Cấu hình Environment Variables

> Hướng dẫn setup `.env` cho lần đầu. Danh sách đầy đủ tất cả biến: [Environment Variables Reference](../operations/environment-vars.md)

## Backend

```bash
cp backend/.env.example backend/.env
```

Các biến **bắt buộc** phải điền:

| Biến | Giá trị dev | Ghi chú |
|------|-------------|---------|
| `DATABASE_URL` | `postgresql://ecommerce_user:ecommerce_pass@localhost:5432/ecommerce` | Khớp với docker-compose.dev.yml |
| `REDIS_URL` | `redis://:redis_pass@localhost:6379` | Khớp với docker-compose.dev.yml |
| `JWT_SECRET` | Bất kỳ string ≥ 32 chars | Khác với JWT_REFRESH_SECRET |
| `JWT_REFRESH_SECRET` | Bất kỳ string ≥ 32 chars | Khác với JWT_SECRET |
| `FRONTEND_URL` | `http://localhost:5173` | Dùng cho CORS |

## AI Service

```bash
cp ai-service/.env.example ai-service/.env
```

Bắt buộc có `GEMINI_API_KEY`. Lấy từ [Google AI Studio](https://aistudio.google.com/).

## Storefront & Back-Office

Thường chỉ cần `VITE_API_URL=http://localhost:4000`.

## Payment (Development)

Dùng sandbox credentials:
- **VNPay**: Đăng ký tài khoản thử nghiệm tại [VNPay Sandbox](https://sandbox.vnpayment.vn/)
- **PayPal**: Tạo sandbox app tại [PayPal Developer](https://developer.paypal.com/)

> **Nếu không có payment credentials**: Backend vẫn chạy bình thường. Payment endpoints sẽ fail nhưng các tính năng khác không ảnh hưởng.
