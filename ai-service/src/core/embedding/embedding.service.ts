import { LruCache } from '../../common/cache/lru-cache';
import { logInfo } from '../../common/logger';
import { CircuitBreaker } from '../../common/resilience/circuit-breaker';
import { withRetry } from '../../common/resilience/retry';
import { ProductEmbeddingPayload } from '../../common/types/recommendation.types';
import { EmbeddingClient } from './embedding-client.interface';

export class EmbeddingService {
  private readonly breaker: CircuitBreaker;
  private readonly cache = new LruCache<string, number[]>(500, 24 * 60 * 60 * 1000); // 500 items, 24h TTL

  constructor(
    private readonly client: EmbeddingClient,
    private readonly expectedDimensions?: number,
    circuitBreakerConfig: { failureThreshold?: number } = {},
  ) {
    this.breaker = new CircuitBreaker({
      name: 'embedding-provider',
      failureThreshold: circuitBreakerConfig.failureThreshold ?? 5,
    });
  }

  buildInput(payload: ProductEmbeddingPayload): string {
    return [
      sanitizeText(payload.name),
      sanitizeText(payload.description),
      payload.category ? `Category: ${sanitizeText(payload.category)}` : '',
    ]
      .filter(Boolean)
      .join('. ');
  }

  getCircuitState() {
    return this.breaker.getState();
  }

  async embed(payload: ProductEmbeddingPayload): Promise<number[]> {
    const cached = this.cache.get(payload.id);
    if (cached) {
      logInfo('embedding.cache_hit', { productId: payload.id });
      return cached;
    }

    const input = this.buildInput(payload);
    const startedAt = Date.now();

    const vector = await this.breaker.execute(() =>
      withRetry(() => this.client.createEmbedding(input, payload.id)),
    );

    const latencyMs = Date.now() - startedAt;

    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error('Embedding provider returned an empty vector');
    }

    if (this.expectedDimensions && vector.length !== this.expectedDimensions) {
      throw new Error(
        `Unexpected embedding length ${vector.length}; expected ${this.expectedDimensions}`,
      );
    }

    this.cache.set(payload.id, vector);

    logInfo('embedding.completed', {
      productId: payload.id,
      vectorLength: vector.length,
      latencyMs,
    });

    return vector;
  }
}

function sanitizeText(value?: string): string {
  return (value ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
