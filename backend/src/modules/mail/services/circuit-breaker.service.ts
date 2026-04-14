import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export enum CircuitBreakerState {
    CLOSED = 'CLOSED',       // Operating normally
    OPEN = 'OPEN',           // Falling back
    HALF_OPEN = 'HALF_OPEN', // Testing recovery
}

/**
 * L8-Grade Stateful Circuit Breaker
 * Uses Redis to maintain state and sliding window error rates across distributed workers.
 */
@Injectable()
export class CircuitBreakerService {
    private readonly redis: Redis;
    private readonly logger = new Logger(CircuitBreakerService.name);

    // Configuration
    private readonly WINDOW_SECONDS = 30;
    private readonly MIN_REQUESTS = 20;
    private readonly ERROR_THRESHOLD_PERCENT = 30; // > 30% failure rate
    private readonly COOLDOWN_SECONDS = 30; // Time in OPEN before transitioning to HALF_OPEN

    constructor(private readonly configService: ConfigService) {
        const redisUrl = this.configService.get<string>('REDIS_URL') || process.env.REDIS_URL;
        
        if (redisUrl && redisUrl.trim() !== '') {
            const isTls = redisUrl.startsWith('rediss://');
            this.redis = new Redis(redisUrl, {
                maxRetriesPerRequest: null,
                tls: isTls ? {} : undefined,
            });
        } else {
            this.redis = new Redis({
                host: this.configService.get<string>('REDIS_HOST') || 'localhost',
                port: this.configService.get<number>('REDIS_PORT') || 6379,
                password: this.configService.get<string>('REDIS_PASSWORD'),
                maxRetriesPerRequest: null,
            });
        }

        this.redis.on('error', (err) => {
            this.logger.error(`Redis connection error in CircuitBreaker: ${err.message}`);
        });
    }

    private getStateKey(provider: string) { return `cb:state:${provider}`; }
    private getSuccessKey(provider: string) { return `cb:success:${provider}`; }
    private getFailKey(provider: string) { return `cb:fail:${provider}`; }
    private getOpenTimestampKey(provider: string) { return `cb:open_time:${provider}`; }

    /**
     * Checks if the provider is allowed to process a request.
     * Evaluates state transitions (OPEN -> HALF_OPEN).
     */
    async getState(provider: string): Promise<CircuitBreakerState> {
        const stateKey = this.getStateKey(provider);
        let state = await this.redis.get(stateKey) as CircuitBreakerState;

        if (!state) {
            state = CircuitBreakerState.CLOSED;
            await this.redis.set(stateKey, state);
        }

        if (state === CircuitBreakerState.OPEN) {
            // Check if cooldown has passed
            const openTimeStr = await this.redis.get(this.getOpenTimestampKey(provider));
            if (openTimeStr) {
                const openTime = parseInt(openTimeStr, 10);
                const now = Date.now();
                if (now - openTime > this.COOLDOWN_SECONDS * 1000) {
                    // Transition to HALF_OPEN
                    await this.redis.set(stateKey, CircuitBreakerState.HALF_OPEN);
                    this.logger.log(`CircuitBreaker [${provider}]: Cooldown finished. Transitioning OPEN -> HALF_OPEN`);
                    return CircuitBreakerState.HALF_OPEN;
                }
            }
        }

        return state;
    }

    /**
     * Records a successful operation and updates the state machine.
     */
    async recordSuccess(provider: string) {
        const now = Date.now();
        const successKey = this.getSuccessKey(provider);
        const stateKey = this.getStateKey(provider);

        const state = await this.getState(provider);

        if (state === CircuitBreakerState.HALF_OPEN) {
            // Recovery successful
            const pipeline = this.redis.pipeline();
            pipeline.set(stateKey, CircuitBreakerState.CLOSED);
            pipeline.del(this.getFailKey(provider));
            pipeline.del(this.getSuccessKey(provider));
            await pipeline.exec();
            this.logger.log(`CircuitBreaker [${provider}]: Recovery successful. Transitioning HALF_OPEN -> CLOSED`);
            return;
        }

        // Standard sliding window update
        const pipeline = this.redis.pipeline();
        pipeline.zadd(successKey, now, `${now}-${Math.random()}`);
        pipeline.zremrangebyscore(successKey, 0, now - (this.WINDOW_SECONDS * 1000));
        pipeline.expire(successKey, this.WINDOW_SECONDS * 2);
        await pipeline.exec();
    }

    /**
     * Records a failed operation and evaluates error rate.
     */
    async recordFailure(provider: string) {
        const now = Date.now();
        const failKey = this.getFailKey(provider);
        const stateKey = this.getStateKey(provider);

        const state = await this.getState(provider);

        if (state === CircuitBreakerState.HALF_OPEN) {
            // Recovery failed -> Back to OPEN
            await this.redis.set(stateKey, CircuitBreakerState.OPEN);
            await this.redis.set(this.getOpenTimestampKey(provider), now);
            this.logger.warn(`CircuitBreaker [${provider}]: Recovery failed. Transitioning HALF_OPEN -> OPEN`);
            return;
        }

        const successKey = this.getSuccessKey(provider);

        // Add failure to sliding window
        let pipeline = this.redis.pipeline();
        pipeline.zadd(failKey, now, `${now}-${Math.random()}`);
        pipeline.zremrangebyscore(failKey, 0, now - (this.WINDOW_SECONDS * 1000));
        pipeline.expire(failKey, this.WINDOW_SECONDS * 2);
        // Clean up success list timestamp as well to keep count accurate
        pipeline.zremrangebyscore(successKey, 0, now - (this.WINDOW_SECONDS * 1000));
        await pipeline.exec();

        // Evaluate Error Rate
        pipeline = this.redis.pipeline();
        pipeline.zcard(successKey);
        pipeline.zcard(failKey);
        const results = await pipeline.exec();
        
        if (results && results.length === 2 && !results[0][0] && !results[1][0]) {
            const successCount = results[0][1] as number;
            const failCount = results[1][1] as number;
            const total = successCount + failCount;

            if (total >= this.MIN_REQUESTS) {
                const errorRate = (failCount / total) * 100;
                if (errorRate > this.ERROR_THRESHOLD_PERCENT) {
                    // Open the circuit
                    await this.redis.set(stateKey, CircuitBreakerState.OPEN);
                    await this.redis.set(this.getOpenTimestampKey(provider), now);
                    this.logger.error(`CircuitBreaker [${provider}]: Error rate ${errorRate.toFixed(1)}% (${failCount}/${total}) exceeded threshold. Transitioning CLOSED -> OPEN`);
                }
            }
        }
    }

    async onModuleDestroy() {
        await this.redis.quit();
    }
}
