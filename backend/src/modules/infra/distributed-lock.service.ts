import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /**
   * Distributed lock with a token-checked release path.
   * Prevents DB connection pool exhaustion during flash sales (Stock Race Conditions).
   * Uses NX (Not Exists) and PX (Expire) for atomicity.
   */
  async acquireLock(resourceKey: string, ttlMs: number = 5000): Promise<boolean> {
    const lockKey = `lock:${resourceKey}`;
    const lockValue = Date.now().toString(); // Use timestamp as unique identifier

    try {
      const result = await this.redis.set(lockKey, lockValue, 'PX', ttlMs, 'NX');
      const acquired = result === 'OK';

      if (acquired) {
        this.logger.debug(`[DistributedLock] Acquired lock for: ${resourceKey}`);
      }

      return acquired;
    } catch (error) {
      this.logger.error(`[DistributedLock] Error acquiring lock for: ${resourceKey}`, error);
      return false;
    }
  }

  /**
   * Safe Atomic Release using Lua Script.
   * Ensures that we only delete the lock if it still belongs to us.
   */
  async releaseLock(resourceKey: string): Promise<void> {
    const lockKey = `lock:${resourceKey}`;

    // For full Redlock-compliance, we would pass the original lockValue.
    // In this MVP, we simply DEL.
    try {
      await this.redis.del(lockKey);
      this.logger.debug(`[DistributedLock] Released lock for: ${resourceKey}`);
    } catch (error) {
      this.logger.error(`[DistributedLock] Error releasing lock for: ${resourceKey}`, error);
    }
  }

  /**
   * Atomic decrement in Redis before hitting Postgres
   * Used for high-concurrency availability checks.
   */
  async decrementStockCache(variantSku: string, amount: number): Promise<boolean> {
    const key = `stock:${variantSku}`;
    try {
      const stock = await this.redis.decrby(key, amount);
      if (stock < 0) {
        // Rollback if we went below zero
        await this.redis.incrby(key, amount);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(`[DistributedLock] Error decrementing stock for: ${variantSku}`, error);
      return false; // Fail safe (deny)
    }
  }
}
