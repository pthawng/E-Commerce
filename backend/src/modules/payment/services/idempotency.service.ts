import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Idempotency Service
 * Prevents duplicate payment operations using Redis
 */
@Injectable()
export class IdempotencyService {
    private readonly redis: Redis;
    private readonly lockTTL = 30000; // 30 seconds
    private readonly resultTTL = 86400; // 24 hours

    constructor(private readonly configService: ConfigService) {
        const redisHost = this.configService.get<string>('REDIS_HOST') || 'localhost';
        const redisPort = this.configService.get<number>('REDIS_PORT') || 6379;
        const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

        this.redis = new Redis({
            host: redisHost,
            port: redisPort,
            password: redisPassword,
            retryStrategy: (times) => {
                // Retry connection with exponential backoff
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });
    }

    /**
     * Acquire distributed lock for idempotency
     * @param key - Idempotency key
     * @param ttl - Lock TTL in milliseconds (default: 30s)
     * @returns Lock token if acquired, null if already locked
     */
    async acquireLock(key: string, ttl: number = this.lockTTL): Promise<string | null> {
        const lockKey = `lock:${key}`;
        const token = `${Date.now()}-${Math.random()}`;

        // SET NX (only if not exists) with expiration
        const result = await this.redis.set(
            lockKey,
            token,
            'PX',
            ttl,
            'NX',
        );

        return result === 'OK' ? token : null;
    }

    /**
     * Release distributed lock
     * @param key - Idempotency key
     * @param token - Lock token from acquireLock
     */
    async releaseLock(key: string, token: string): Promise<void> {
        const lockKey = `lock:${key}`;

        // Lua script to ensure we only delete our own lock
        const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

        await this.redis.eval(script, 1, lockKey, token);
    }

    /**
     * Store idempotent result
     * @param key - Idempotency key
     * @param result - Result to cache
     * @param ttl - TTL in seconds (default: 24 hours)
     */
    async storeResult(
        key: string,
        result: any,
        ttl: number = this.resultTTL,
    ): Promise<void> {
        const resultKey = `idempotency:${key}`;
        await this.redis.setex(resultKey, ttl, JSON.stringify(result));
    }

    /**
     * Get cached idempotent result
     * @param key - Idempotency key
     * @returns Cached result or null
     */
    async getResult(key: string): Promise<any | null> {
        const resultKey = `idempotency:${key}`;
        const cached = await this.redis.get(resultKey);

        if (!cached) {
            return null;
        }

        try {
            return JSON.parse(cached);
        } catch {
            return null;
        }
    }

    /**
     * Check if operation is already in progress
     * @param key - Idempotency key
     * @returns True if locked (in progress)
     */
    async isLocked(key: string): Promise<boolean> {
        const lockKey = `lock:${key}`;
        const exists = await this.redis.exists(lockKey);
        return exists === 1;
    }

    /**
     * Generate idempotency key for payment
     * @param orderId - Order ID
     * @param operation - Operation type
     * @returns Idempotency key
     */
    generatePaymentKey(orderId: string, operation: 'create' | 'callback' | 'refund'): string {
        return `payment:${operation}:${orderId}`;
    }

    /**
     * Generate idempotency key for callback
     * @param transactionId - Transaction ID from gateway
     * @param paymentMethod - Payment method
     * @returns Idempotency key
     */
    generateCallbackKey(transactionId: string, paymentMethod: string): string {
        return `callback:${paymentMethod}:${transactionId}`;
    }

    /**
     * Cleanup (for testing)
     */
    async cleanup(key: string): Promise<void> {
        await this.redis.del(`lock:${key}`, `idempotency:${key}`);
    }

    /**
     * Disconnect Redis
     */
    async onModuleDestroy() {
        await this.redis.quit();
    }
}
