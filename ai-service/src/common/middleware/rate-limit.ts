import type { IncomingMessage, ServerResponse } from 'node:http';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  lastSeen: number;
}

interface RateLimiterOptions {
  requestsPerMinute: number;
  maxBuckets?: number;
  trustProxyHeaders?: boolean;
}

export class RateLimiter {
  private readonly buckets = new Map<string, TokenBucket>();
  private readonly maxTokens: number;
  private readonly refillRateMs: number;
  private readonly maxBuckets: number;
  private readonly trustProxyHeaders: boolean;
  private nextCleanupAt = 0;

  constructor(options: RateLimiterOptions) {
    this.maxTokens = Math.max(1, Math.floor(options.requestsPerMinute));
    this.refillRateMs = 60_000 / this.maxTokens;
    this.maxBuckets = options.maxBuckets ?? 10_000;
    this.trustProxyHeaders = options.trustProxyHeaders ?? false;
  }

  isAllowed(ip: string): boolean {
    const now = Date.now();
    this.cleanup(now);

    let bucket = this.buckets.get(ip);

    if (!bucket) {
      if (this.buckets.size >= this.maxBuckets) {
        this.evictOldestBucket();
      }

      bucket = { tokens: this.maxTokens - 1, lastRefill: now, lastSeen: now };
      this.buckets.set(ip, bucket);
      return true;
    }

    bucket.lastSeen = now;
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
    const ip = this.getClientIp(request);

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

  private getClientIp(request: IncomingMessage): string {
    if (this.trustProxyHeaders) {
      const forwardedFor = request.headers['x-forwarded-for'];
      const firstForwardedIp = typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : undefined;
      if (firstForwardedIp) return firstForwardedIp;
    }

    return request.socket.remoteAddress ?? 'unknown';
  }

  private cleanup(now: number): void {
    if (now < this.nextCleanupAt) return;
    this.nextCleanupAt = now + 60_000;

    const staleAfterMs = 10 * 60_000;
    for (const [ip, bucket] of this.buckets) {
      if (now - bucket.lastSeen > staleAfterMs) {
        this.buckets.delete(ip);
      }
    }
  }

  private evictOldestBucket(): void {
    let oldestIp: string | undefined;
    let oldestLastSeen = Number.POSITIVE_INFINITY;

    for (const [ip, bucket] of this.buckets) {
      if (bucket.lastSeen < oldestLastSeen) {
        oldestIp = ip;
        oldestLastSeen = bucket.lastSeen;
      }
    }

    if (oldestIp) {
      this.buckets.delete(oldestIp);
    }
  }
}
