import type { IncomingMessage, ServerResponse } from 'node:http';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

/**
 * In-memory token bucket rate limiter per IP.
 * FAANG standard: shed load at the edge, never let bad callers starve good ones.
 */
export class RateLimiter {
  private readonly buckets = new Map<string, TokenBucket>();
  private readonly maxTokens: number;
  private readonly refillRateMs: number; // ms per token

  constructor(requestsPerMinute: number) {
    this.maxTokens = requestsPerMinute;
    this.refillRateMs = 60_000 / requestsPerMinute;
  }

  isAllowed(ip: string): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(ip);

    if (!bucket) {
      bucket = { tokens: this.maxTokens - 1, lastRefill: now };
      this.buckets.set(ip, bucket);
      return true;
    }

    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill;
    const refill = Math.floor(elapsed / this.refillRateMs);
    if (refill > 0) {
      bucket.tokens = Math.min(this.maxTokens, bucket.tokens + refill);
      bucket.lastRefill = now;
    }

    if (bucket.tokens > 0) {
      bucket.tokens--;
      return true;
    }

    return false;
  }

  middleware(
    request: IncomingMessage,
    response: ServerResponse,
    requestsPerMinute: number,
  ): boolean {
    const ip =
      (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      request.socket.remoteAddress ??
      'unknown';

    if (!this.isAllowed(ip)) {
      const retryAfter = Math.ceil(this.refillRateMs / 1000);
      response.statusCode = 429;
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.setHeader('Retry-After', String(retryAfter));
      response.end(
        JSON.stringify({
          message: `Rate limit exceeded. Max ${requestsPerMinute} req/min per IP.`,
          retryAfterSeconds: retryAfter,
        }),
      );
      return false;
    }
    return true;
  }
}
