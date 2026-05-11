import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { EMBEDDING_PROVIDER } from '../llm/llm.module';
import { EmbeddingProvider } from '../llm/llm-provider.interface';
import { CircuitBreaker } from '../../common/resilience/circuit-breaker';
import { withRetry } from '../../common/resilience/retry';
import { ProductEmbeddingPayload } from '../../common/types/recommendation.types';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly breaker: CircuitBreaker;
  private readonly expectedDimensions: number;
  private readonly ttlSeconds: number;

  constructor(
    @Inject(EMBEDDING_PROVIDER) private readonly client: EmbeddingProvider,
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {
    this.expectedDimensions = this.configService.get<number>('AI_EMBEDDING_DIMENSIONS', 768);
    this.ttlSeconds = 24 * 60 * 60; // 24 hours
    this.breaker = new CircuitBreaker({
      name: 'embedding-provider',
      failureThreshold: this.configService.get<number>('CIRCUIT_BREAKER_THRESHOLD', 5),
    });
  }

  async embed(payload: ProductEmbeddingPayload): Promise<number[]> {
    const input = this.buildInput(payload);
    return this.embedText(input, `embed:prod:${payload.id}`, payload.id);
  }

  async embedText(input: string, cacheKey?: string, user?: string): Promise<number[]> {
    const normalizedInput = sanitizeText(input);
    if (!normalizedInput) {
      throw new Error('Embedding input is required');
    }

    if (cacheKey) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const vector = await this.breaker.execute(() =>
      withRetry(() => this.client.createEmbedding(normalizedInput, user)),
    );

    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error('Embedding provider returned an empty vector');
    }

    if (this.expectedDimensions && vector.length !== this.expectedDimensions) {
      throw new Error(
        `Unexpected embedding length ${vector.length}; expected ${this.expectedDimensions}`,
      );
    }

    if (cacheKey) {
      await this.redis.set(cacheKey, JSON.stringify(vector), 'EX', this.ttlSeconds);
    }

    return vector;
  }

  private buildInput(payload: ProductEmbeddingPayload): string {
    return [
      sanitizeText(payload.name),
      sanitizeText(payload.description),
      payload.category ? `Category: ${sanitizeText(payload.category)}` : '',
    ]
      .filter(Boolean)
      .join('. ');
  }
}

function sanitizeText(value?: string): string {
  return (value ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
