# Payment Module

Comprehensive payment module for Ray Paradis E-Commerce platform with support for multiple payment gateways.

## Features

- ✅ **Strategy Pattern Architecture** - Easy to add new payment providers
- ✅ **VNPAY Integration** - Vietnamese payment gateway
- ✅ **PayPal Integration** - International payment gateway
- ✅ **COD Support** - Cash on Delivery
- ✅ **Refund Processing** - Automated refund with inventory restoration
- ✅ **Transaction Management** - Atomic database transactions
- ✅ **Webhook Handling** - Secure callback verification
- ✅ **Order Timeline** - Complete payment audit trail

## Architecture

### Strategy Pattern

The payment module uses the Strategy Pattern to support multiple payment providers:

```
IPaymentProvider (Interface)
    ├── BasePaymentProvider (Abstract Class)
    │   ├── VNPayProvider
    │   ├── PayPalProvider
    │   └── CODProvider
    └── PaymentService (Orchestrator)
```

### Directory Structure

```
src/modules/payment/
├── providers/
│   ├── base-payment.provider.ts      # Abstract base class
│   ├── vnpay/
│   │   ├── vnpay.provider.ts         # VNPAY implementation
│   │   ├── vnpay.utils.ts            # Hash & signature utilities
│   │   └── vnpay.constants.ts        # VNPAY constants
│   ├── paypal/
│   │   └── paypal.provider.ts        # PayPal implementation
│   └── cod/
│       └── cod.provider.ts           # COD implementation
├── dto/
│   ├── create-payment.dto.ts         # Payment creation DTO
│   ├── refund.dto.ts                 # Refund DTOs
│   └── vnpay-callback.dto.ts         # VNPAY callback DTO
├── types/
│   └── payment.types.ts              # TypeScript interfaces
├── payment.service.ts                # Main payment service
├── payment.controller.ts             # REST API endpoints
└── payment.module.ts                 # NestJS module
```

## API Endpoints

### Create Payment
```http
POST /api/payment/create
Content-Type: application/json

{
  "orderId": "uuid",
  "paymentMethod": "VNPAY",
  "returnUrl": "http://localhost:5173/payment/success",
  "cancelUrl": "http://localhost:5173/payment/cancel",
  "bankCode": "NCB"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "ORD-240202-1234_1706865600000",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "paymentMethod": "VNPAY"
  }
}
```

### VNPAY Callback
```http
GET /api/payment/vnpay/callback?vnp_TxnRef=...&vnp_Amount=...&vnp_SecureHash=...
```

Automatically redirects to frontend with payment result.

### PayPal Capture
```http
POST /api/payment/paypal/capture/:paypalOrderId
```

### Process Refund
```http
POST /api/payment/refund/:orderId
Content-Type: application/json

{
  "amount": 100000,
  "reason": "Customer requested refund",
  "restoreInventory": true
}
```

### Confirm COD Payment
```http
POST /api/payment/cod/confirm
Content-Type: application/json

{
  "orderId": "uuid",
  "amount": 100000,
  "note": "Payment received in cash"
}
```

### Get Payment Status
```http
GET /api/payment/status/:orderId
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# VNPAY Configuration
VNPAY_TMN_CODE=your_vnpay_tmn_code
VNPAY_HASH_SECRET=your_vnpay_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5173/payment/vnpay/callback
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Getting Credentials

**VNPAY:**
1. Register at [VNPAY Sandbox](https://sandbox.vnpayment.vn/)
2. Get TMN Code and Hash Secret from merchant dashboard

**PayPal:**
1. Create app at [PayPal Developer](https://developer.paypal.com/)
2. Get Client ID and Secret from app credentials

## Usage

### In Your Order Service

```typescript
import { PaymentService } from '@modules/payment/payment.service';

@Injectable()
export class OrderService {
  constructor(private readonly paymentService: PaymentService) {}

  async createOrder(dto: CreateOrderDto) {
    // Create order first
    const order = await this.prisma.order.create({...});

    // Create payment
    const payment = await this.paymentService.createPayment(
      order.id,
      dto.paymentMethod,
      {
        returnUrl: dto.returnUrl,
        cancelUrl: dto.cancelUrl,
        ipAddr: req.ip,
      }
    );

    return {
      order,
      paymentUrl: payment.paymentUrl, // Redirect user here
    };
  }
}
```

### Processing Refunds

```typescript
// Refund with inventory restoration
await this.paymentService.processRefund(
  orderId,
  100000,
  'Customer requested refund',
  true // restore inventory
);
```

## Payment Flow

### VNPAY Flow
1. User selects VNPAY payment
2. Backend creates payment and returns VNPAY URL
3. User completes payment on VNPAY
4. VNPAY redirects to callback URL
5. Backend verifies signature and updates order
6. User redirected to success page

### PayPal Flow
1. User selects PayPal payment
2. Backend creates PayPal order
3. User approves payment on PayPal
4. Frontend calls capture endpoint
5. Backend captures payment and updates order

### COD Flow
1. User selects COD
2. Order created with pending payment
3. Staff confirms payment upon delivery
4. Backend updates order status

## Security

### VNPAY
- ✅ HMAC SHA512 signature verification
- ✅ Parameter sorting and encoding
- ✅ Secure hash validation

### PayPal
- ✅ OAuth 2.0 authentication
- ✅ Webhook signature verification (recommended)
- ✅ TLS/SSL encryption

### General
- ✅ Environment variable protection
- ✅ Database transaction atomicity
- ✅ Input validation with DTOs
- ✅ Error handling and logging

## Refund & Inventory

When processing refunds with `restoreInventory: true`:

1. Creates refund transaction with payment gateway
2. Updates order status to `refunded`
3. Restores inventory quantities
4. Creates inventory logs for audit trail
5. Creates order timeline entry

## Error Handling

All payment operations include comprehensive error handling:

```typescript
try {
  const payment = await paymentService.createPayment(...);
} catch (error) {
  if (error instanceof NotFoundException) {
    // Order not found
  } else if (error instanceof BadRequestException) {
    // Invalid payment method or order already paid
  } else {
    // Gateway error
  }
}
```

## Logging

All payment operations are logged:

```
[PaymentService] Payment created for order xxx, method: VNPAY, transaction: xxx
[VNPayProvider] Creating payment for order xxx, amount: 100000, method: VNPAY
[PaymentService] Payment callback processed for order xxx, status: success
[PaymentService] Refund processed for order xxx, amount: 100000
```

## Testing

### Manual Testing with Sandbox

**VNPAY Sandbox:**
- Test card: 9704198526191432198
- Name: NGUYEN VAN A
- Issue date: 07/15
- OTP: 123456

**PayPal Sandbox:**
- Use sandbox accounts from PayPal Developer Dashboard

### Integration Tests

```typescript
describe('PaymentService', () => {
  it('should create VNPAY payment', async () => {
    const result = await paymentService.createPayment(
      orderId,
      PaymentMethodEnum.VNPAY,
      { ipAddr: '127.0.0.1' }
    );
    
    expect(result.success).toBe(true);
    expect(result.paymentUrl).toContain('vnpayment.vn');
  });
});
```

## Adding New Payment Provider

1. Create provider class extending `BasePaymentProvider`
2. Implement required methods: `doCreatePayment`, `doVerifyCallback`, `doProcessRefund`
3. Register in `PaymentService` constructor
4. Add to `PaymentMethodEnum`

Example:

```typescript
@Injectable()
export class StripeProvider extends BasePaymentProvider {
  constructor() {
    super('StripeProvider');
  }

  protected async doCreatePayment(...) {
    // Stripe implementation
  }

  protected async doVerifyCallback(...) {
    // Stripe webhook verification
  }

  protected async doProcessRefund(...) {
    // Stripe refund
  }

  getPaymentMethod(): PaymentMethodEnum {
    return PaymentMethodEnum.STRIPE;
  }
}
```

## Production Checklist

- [ ] Update VNPAY URL to production endpoint
- [ ] Update PayPal mode to `production`
- [ ] Configure webhook URLs in payment gateways
- [ ] Set up SSL/TLS certificates
- [ ] Enable webhook signature verification
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and alerts
- [ ] Test refund flows
- [ ] Document payment reconciliation process

## Support

For issues or questions:
- VNPAY: [VNPAY Support](https://vnpay.vn/ho-tro)
- PayPal: [PayPal Developer Support](https://developer.paypal.com/support/)
