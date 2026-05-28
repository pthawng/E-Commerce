import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiHttpError } from '../../common/errors';
import { requestJson } from '../../common/http';
import { CircuitBreaker } from '../../common/resilience/circuit-breaker';
import {
  ProductSearchFilters,
  ProductSearchResult,
  RecommendationResult,
  VectorRecord,
} from '../../common/types/recommendation.types';

interface QdrantSearchResponse {
  result?: {
    points?: Array<{
      id: string | number;
      score: number;
      payload?: any;
    }>;
  };
}

interface QdrantRetrieveResponse {
  result?: Array<{
    id: string | number;
    payload?: any;
    vector?: number[] | { default?: number[]; sparse?: any };
  }>;
}

export interface QdrantSearchOptions {
  excludeProductId?: string;
  filters?: ProductSearchFilters;
  sparseVector?: { indices: number[]; values: number[] };
}

@Injectable()
export class QdrantClient {
  private readonly logger = new Logger(QdrantClient.name);
  private collectionReady = false;
  private collectionInitPromise?: Promise<void>;
  private readonly breaker: CircuitBreaker;
  private readonly baseUrl: string;
  private readonly collectionName: string;
  private readonly vectorSize: number;
  private readonly requestTimeoutMs: number;
  private readonly apiKey?: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('QDRANT_URL')!.replace(/\/$/, '');
    this.collectionName = this.configService.get<string>('QDRANT_COLLECTION', 'products');
    this.vectorSize = Number(this.configService.get<number>('AI_EMBEDDING_DIMENSIONS', 768));
    this.requestTimeoutMs = Number(this.configService.get<number>('AI_REQUEST_TIMEOUT_MS', 5000));
    this.apiKey = this.configService.get<string>('QDRANT_API_KEY');

    this.breaker = new CircuitBreaker({
      name: 'qdrant-db',
      failureThreshold: Number(this.configService.get<number>('CIRCUIT_BREAKER_THRESHOLD', 5)),
    });
  }

  async ensureCollection(): Promise<void> {
    if (this.collectionReady) return;

    if (!this.collectionInitPromise) {
      this.collectionInitPromise = this.doEnsureCollection();
    }

    try {
      await this.collectionInitPromise;
    } catch (error) {
      this.collectionInitPromise = undefined;
      throw error;
    }
  }

  private async doEnsureCollection(): Promise<void> {
    const headers = this.headers();
    const collectionUrl = this.collectionUrl();

    try {
      const response = await fetch(collectionUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(this.requestTimeoutMs),
      });

      if (response.status === 404) {
        await requestJson(this.collectionUrl(), {
          method: 'PUT',
          timeoutMs: this.requestTimeoutMs,
          headers,
          body: JSON.stringify({
            vectors: {
              default: {
                size: this.vectorSize,
                distance: 'Cosine',
              },
            },
            sparse_vectors: {
              "text": { index: { on_disk: true } }
            }
          }),
        });
        this.logger.log(`Qdrant collection created: ${this.collectionName}`);
      } else if (!response.ok) {
        const errorText = await response.text();
        throw new AiHttpError(
          `Unable to verify Qdrant collection ${this.collectionName}`,
          response.status,
          errorText,
        );
      }

      this.collectionReady = true;
    } catch (error) {
      if (error instanceof AiHttpError) throw error;
      throw new AiHttpError(`Qdrant connection failed: ${error}`, 503);
    }
  }

  async upsert(record: VectorRecord & { sparseVector?: any }): Promise<void> {
    await this.ensureCollection();

    await this.breaker.execute(() =>
      requestJson(this.pointsUrl(), {
        method: 'PUT',
        timeoutMs: this.requestTimeoutMs,
        headers: this.headers(),
        body: JSON.stringify({
          points: [
            {
              id: record.id,
              vector: record.sparseVector
                ? { default: record.vector, text: record.sparseVector }
                : { default: record.vector },
              payload: record.payload,
            },
          ],
        }),
      })
    );
  }

  async getVector(productId: string): Promise<number[]> {
    await this.ensureCollection();

    const response = await this.breaker.execute(() =>
      requestJson<QdrantRetrieveResponse>(this.pointsUrl(), {
        method: 'POST',
        timeoutMs: this.requestTimeoutMs,
        headers: this.headers(),
        body: JSON.stringify({
          ids: [productId],
          with_vector: true,
          with_payload: false,
        }),
      })
    );

    const res = response.result?.[0]?.vector;
    if (Array.isArray(res)) return res;
    if (res && typeof res === 'object') {
      if ('default' in res && Array.isArray(res.default)) return res.default;
      if ('' in res && Array.isArray((res as any)[''])) return (res as any)[''];
    }

    throw new AiHttpError(`Vector not found for product ${productId}`, 404);
  }

  async search(
    vector: number[],
    limit: number,
    options: QdrantSearchOptions = {},
  ): Promise<ProductSearchResult[]> {
    await this.ensureCollection();

    const filter = this.buildSearchFilter(options);
    const body: any = {
      limit,
      ...(filter ? { filter } : {}),
      with_payload: true,
      with_vector: false,
    };

    if (options.sparseVector) {
      body.prefetch = [
        { query: vector, using: 'default', limit: limit * 2 },
        { query: options.sparseVector, using: 'text', limit: limit * 2 }
      ];
      body.query = { fusion: "rrf" };
    } else {
      body.query = vector;
      body.using = 'default';
    }

    const response = await this.breaker.execute(() =>
      requestJson<QdrantSearchResponse>(this.queryUrl(), {
        method: 'POST',
        timeoutMs: this.requestTimeoutMs,
        headers: this.headers(),
        body: JSON.stringify(body),
      })
    );

    return (response.result?.points ?? []).map((point) => ({
      productId: String(point.id),
      score: point.score,
      slug: point.payload?.slug,
      imageUrl: point.payload?.imageUrl,
      name: point.payload?.name,
      category: point.payload?.category,
      price: point.payload?.price,
    }));
  }

  async searchSimilar(
    vector: number[],
    limit: number,
    excludeProductId?: string,
  ): Promise<RecommendationResult[]> {
    return this.search(vector, limit, { excludeProductId });
  }

  private buildSearchFilter(options: QdrantSearchOptions) {
    const must: any[] = [];
    const mustNot: any[] = [];
    const filters = options.filters;

    if (options.excludeProductId) {
      mustNot.push({ has_id: [options.excludeProductId] });
    }

    if (filters?.isActive !== undefined) {
      must.push({
        key: 'isActive',
        match: { value: filters.isActive },
      });
    }

    if (filters?.category) {
      must.push({
        key: 'category',
        match: { value: filters.category },
      });
    }

    if (filters?.material) {
      must.push({
        key: 'material',
        match: { value: filters.material },
      });
    }

    if (filters?.gender) {
      must.push({
        key: 'gender',
        match: { value: filters.gender },
      });
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      must.push({
        key: 'price',
        range: {
          ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
          ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
        },
      });
    }

    if (must.length === 0 && mustNot.length === 0) return undefined;

    return {
      ...(must.length ? { must } : {}),
      ...(mustNot.length ? { must_not: mustNot } : {}),
    };
  }

  private collectionUrl() { return `${this.baseUrl}/collections/${this.collectionName}`; }
  private pointsUrl() { return `${this.collectionUrl()}/points`; }
  private queryUrl() { return `${this.pointsUrl()}/query`; }
  private headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { 'api-key': this.apiKey } : {}),
    };
  }
}
