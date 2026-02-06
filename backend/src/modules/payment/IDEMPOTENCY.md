# Idempotency Protection

## Overview

The payment module implements **idempotency protection** to prevent duplicate operations and ensure data consistency. This is critical for payment processing where network retries, duplicate callbacks, or concurrent requests could cause serious issues.

## Why Idempotency Matters

### Problems Without Idempotency

❌ **Duplicate Payments**: User clicks "Pay" multiple times → Multiple charges  
❌ **Duplicate Callbacks**: Payment gateway sends IPN twice → Order confirmed twice  
❌ **Double Refunds**: Staff clicks refund twice → Money refunded twice  
❌ **Race Conditions**: Concurrent requests → Inconsistent database state  
❌ **Inventory Issues**: Multiple deductions for same order

### Benefits With Idempotency

✅ **Safe Retries**: Client can safely retry failed requests  
✅ **Duplicate Prevention**: Same operation won't execute twice  
✅ **Consistency**: Database stays consistent even with concurrent requests  
✅ **Audit Trail**: Clear logging of duplicate attempts  
✅ **Better UX**: Users can click buttons without fear

## Architecture

### Redis-Based Distributed Locking

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. Request payment
       ▼
┌─────────────────────────┐
│  PaymentService         │
│  ┌───────────────────┐  │
│  │ Generate Key      │  │
│  │ payment:create:   │  │
│  │ {orderId}         │  │
│  └────────┬──────────┘  │
│           │              │
│           ▼              │
│  ┌───────────────────┐  │
│  │ Check Cache       │──┼──► Return cached result
│  └────────┬──────────┘  │
│           │ Not cached   │
│           ▼              │
│  ┌───────────────────┐  │
│  │ Acquire Lock      │  │
│  │ (Redis SET NX)    │  │
│  └────────┬──────────┘  │
│           │              │
│     ┌─────┴─────┐        │
│     │ Success?  │        │
│     └─────┬─────┘        │
│      Yes  │  No          │
│           │  └──────────┼──► Throw ConflictException
│           ▼              │
│  ┌───────────────────┐  │
│  │ Execute Operation │  │
│  └────────┬──────────┘  │
│           │              │
│           ▼              │
│  ┌───────────────────┐  │
│  │ Cache Result      │  │
│  │ (24h TTL)         │  │
│  └────────┬──────────┘  │
│           │              │
│           ▼              │
│  ┌───────────────────┐  │
│  │ Release Lock      │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

## Implementation

### IdempotencyService

[idempotency.service.ts](file:///e:/Web%20-%20E%20Commerce/backend/src/modules/payment/services/idempotency.service.ts)

**Key Methods:**

```typescript
// Acquire distributed lock
async acquireLock(key: string, ttl: number = 30000): Promise<string | null>

// Release lock
async releaseLock(key: string, token: string): Promise<void>

// Store result in cache
async storeResult(key: string, result: any, ttl: number = 86400): Promise<void>

// Get cached result
async getResult(key: string): Promise<any | null>

// Generate idempotency keys
generatePaymentKey(orderId: string, operation: 'create' | 'callback' | 'refund'): string
generateCallbackKey(transactionId: string, paymentMethod: string): string
```

### Protected Operations

#### 1. Create Payment

**Idempotency Key**: `payment:create:{orderId}`

```typescript
async createPayment(orderId: string, paymentMethod: PaymentMethodEnum) {
  const key = this.idempotencyService.generatePaymentKey(orderId, 'create');
  
  // Check cache
  const cached = await this.idempotencyService.getResult(key);
  if (cached) return cached;
  
  // Acquire lock
  const token = await this.idempotencyService.acquireLock(key);
  if (!token) throw new ConflictException('Payment creation already in progress');
  
  try {
    // Create payment
    const result = await provider.createPayment(...);
    
    // Cache result
    await this.idempotencyService.storeResult(key, result);
    
    return result;
  } finally {
    await this.idempotencyService.releaseLock(key, token);
  }
}
```

**Behavior:**
- ✅ First request: Creates payment, returns payment URL
- ✅ Duplicate request (within 24h): Returns cached payment URL
- ✅ Concurrent request: Throws `ConflictException` (409)

#### 2. Process Callback

**Idempotency Key**: `callback:{paymentMethod}:{transactionId}`

```typescript
async processCallback(paymentMethod: PaymentMethodEnum, callbackData: any) {
  // Verify first to get transaction ID
  const verified = await provider.verifyCallback(callbackData);
  
  const key = this.idempotencyService.generateCallbackKey(
    verified.transactionId,
    paymentMethod
  );
  
  // Check cache
  const cached = await this.idempotencyService.getResult(key);
  if (cached) {
    this.logger.log('Callback already processed');
    return cached;
  }
  
  // Acquire lock
  const token = await this.idempotencyService.acquireLock(key);
  if (!token) throw new ConflictException('Callback already being processed');
  
  try {
    // Update order & transaction
    await this.prisma.$transaction(async (tx) => {
      // Double-check transaction status
      if (transaction.status === 'success') {
        this.logger.warn('Transaction already successful, skipping');
        return;
      }
      
      // Update...
    });
    
    // Cache result
    await this.idempotencyService.storeResult(key, verified);
    
    return verified;
  } finally {
    await this.idempotencyService.releaseLock(key, token);
  }
}
```

**Behavior:**
- ✅ First callback: Processes payment, updates order
- ✅ Duplicate callback: Returns cached result, no database changes
- ✅ Concurrent callback: Throws `ConflictException`
- ✅ Database-level check: Skips if transaction already successful

#### 3. Process Refund

**Idempotency Key**: `payment:refund:{orderId}`

```typescript
async processRefund(orderId: string, amount: number, reason?: string) {
  const key = this.idempotencyService.generatePaymentKey(orderId, 'refund');
  
  // Check cache
  const cached = await this.idempotencyService.getResult(key);
  if (cached) return cached;
  
  // Acquire lock
  const token = await this.idempotencyService.acquireLock(key);
  if (!token) throw new ConflictException('Refund already in progress');
  
  try {
    return await this.prisma.$transaction(async (tx) => {
      // Check if already refunded
      const existingRefund = order.transactions.find(
        t => t.type === 'refund' && t.status === 'success'
      );
      
      if (existingRefund) {
        throw new BadRequestException('Order already refunded');
      }
      
      // Process refund...
      
      // Cache result
      await this.idempotencyService.storeResult(key, refundResult);
      
      return refundResult;
    });
  } finally {
    await this.idempotencyService.releaseLock(key, token);
  }
}
```

**Behavior:**
- ✅ First refund: Processes refund, restores inventory
- ✅ Duplicate refund: Returns cached result
- ✅ Concurrent refund: Throws `ConflictException`
- ✅ Database-level check: Prevents double refund

## Configuration

### Redis Setup

Required environment variable:

```bash
REDIS_URL=redis://localhost:6379
```

### TTL Settings

```typescript
// Lock TTL: 30 seconds
private readonly lockTTL = 30000;

// Result cache TTL: 24 hours
private readonly resultTTL = 86400;
```

**Why 30 seconds for lock?**
- Long enough for payment gateway API calls
- Short enough to auto-release if process crashes
- Prevents indefinite locks

**Why 24 hours for cache?**
- Covers typical retry windows
- Prevents stale data issues
- Balances memory usage

## Error Handling

### ConflictException (409)

Thrown when operation is already in progress:

```json
{
  "statusCode": 409,
  "message": "Payment creation already in progress. Please wait.",
  "error": "Conflict"
}
```

**Client should:**
- Wait a few seconds
- Retry the request
- Or poll payment status endpoint

### Cached Results

When returning cached results:

```typescript
this.logger.log('Returning cached payment result for order {orderId}');
```

**Behavior:**
- Same response as original request
- No database queries
- Instant response
- Logged for audit

## Testing

### Test Idempotency

```typescript
describe('Payment Idempotency', () => {
  it('should return same result for duplicate payment creation', async () => {
    const result1 = await paymentService.createPayment(orderId, 'VNPAY');
    const result2 = await paymentService.createPayment(orderId, 'VNPAY');
    
    expect(result1.transactionId).toBe(result2.transactionId);
    expect(result1.paymentUrl).toBe(result2.paymentUrl);
  });
  
  it('should throw conflict for concurrent requests', async () => {
    const promise1 = paymentService.createPayment(orderId, 'VNPAY');
    const promise2 = paymentService.createPayment(orderId, 'VNPAY');
    
    await expect(Promise.all([promise1, promise2]))
      .rejects.toThrow(ConflictException);
  });
  
  it('should handle duplicate callbacks gracefully', async () => {
    const callback1 = await paymentService.processCallback('VNPAY', data);
    const callback2 = await paymentService.processCallback('VNPAY', data);
    
    expect(callback1.orderId).toBe(callback2.orderId);
    // Order should only be confirmed once
  });
});
```

### Manual Testing

```bash
# Test duplicate payment creation
curl -X POST http://localhost:4000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{"orderId": "123", "paymentMethod": "VNPAY"}'

# Immediately send again (should return cached result)
curl -X POST http://localhost:4000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{"orderId": "123", "paymentMethod": "VNPAY"}'
```

## Redis Keys

### Lock Keys

Format: `lock:{idempotency_key}`

Examples:
- `lock:payment:create:123e4567-e89b-12d3-a456-426614174000`
- `lock:callback:VNPAY:ORD-240202-1234_1706865600000`
- `lock:payment:refund:123e4567-e89b-12d3-a456-426614174000`

**TTL**: 30 seconds  
**Value**: Lock token (timestamp + random)

### Result Cache Keys

Format: `idempotency:{idempotency_key}`

Examples:
- `idempotency:payment:create:123e4567-e89b-12d3-a456-426614174000`
- `idempotency:callback:VNPAY:ORD-240202-1234_1706865600000`

**TTL**: 24 hours  
**Value**: JSON-serialized result

## Best Practices

### ✅ DO

- Always use idempotency for payment operations
- Set appropriate TTLs based on use case
- Log when returning cached results
- Use distributed locks for critical sections
- Release locks in `finally` blocks
- Check database state as backup

### ❌ DON'T

- Don't skip idempotency checks
- Don't use short TTLs for locks (< 10s)
- Don't forget to release locks
- Don't cache sensitive data without encryption
- Don't rely solely on locks (use DB checks too)

## Monitoring

### Key Metrics

```typescript
// Log when returning cached results
this.logger.log('Returning cached payment result for order {orderId}');

// Log concurrent request attempts
this.logger.warn('Concurrent callback detected for transaction {transactionId}');

// Log when transaction already processed
this.logger.warn('Transaction {transactionId} already successful, skipping update');
```

### Redis Monitoring

```bash
# Check active locks
redis-cli KEYS "lock:*"

# Check cached results
redis-cli KEYS "idempotency:*"

# Monitor lock acquisition
redis-cli MONITOR | grep "lock:"
```

## Production Considerations

### High Availability

- Use Redis Cluster or Sentinel for HA
- Configure Redis persistence (AOF + RDB)
- Set up Redis monitoring and alerts

### Performance

- Lock TTL should be > max operation time
- Cache TTL should cover retry windows
- Monitor Redis memory usage
- Use Redis pipelining for batch operations

### Security

- Use Redis AUTH password
- Enable TLS for Redis connections
- Restrict Redis network access
- Don't cache sensitive payment data

## Troubleshooting

### "Payment creation already in progress"

**Cause**: Another request is processing the same payment  
**Solution**: Wait and retry after a few seconds

### Locks not releasing

**Cause**: Process crashed before releasing lock  
**Solution**: Locks auto-expire after 30s

### Cached results not returning

**Cause**: Redis connection issue or cache expired  
**Solution**: Check Redis connection and TTL settings

### Duplicate operations still occurring

**Cause**: Different idempotency keys or Redis unavailable  
**Solution**: Verify key generation logic and Redis health

## Summary

✅ **Idempotency protection implemented for:**
- Payment creation
- Callback processing  
- Refund processing

✅ **Protection mechanisms:**
- Redis distributed locking
- Result caching (24h)
- Database-level duplicate checks
- Comprehensive logging

✅ **Benefits:**
- Safe retries
- Duplicate prevention
- Race condition protection
- Better user experience

This makes the payment module **production-ready** for handling real-world payment scenarios! 🚀
