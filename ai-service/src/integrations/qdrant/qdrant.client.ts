import { AiHttpError } from '../../common/errors';
import { requestJson } from '../../common/http';
import { logInfo } from '../../common/logger';
import {
  ProductEmbeddingPayload,
  RecommendationResult,
  VectorRecord,
} from '../../common/types/recommendation.types';

interface QdrantSearchResponse {
  result?: {
    points?: Array<{
      id: string | number;
      score: number;
      payload?: ProductEmbeddingPayload;
    }>;
  };
}

interface QdrantRetrieveResponse {
  result?: Array<{
    id: string | number;
    payload?: ProductEmbeddingPayload;
    vector?: number[] | { default?: number[] };
  }>;
}

export class QdrantClient {
  private collectionReady = false;

  constructor(
    private readonly baseUrl: string,
    private readonly collectionName: string,
    private readonly vectorSize: number,
    private readonly requestTimeoutMs: number,
    private readonly apiKey?: string,
  ) {}

  async ensureCollection(): Promise<void> {
    if (this.collectionReady) return;

    const headers = this.headers();
    const collectionUrl = this.collectionUrl();

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
            size: this.vectorSize,
            distance: 'Cosine',
          },
        }),
      });
      logInfo('qdrant.collection.created', {
        collection: this.collectionName,
        vectorSize: this.vectorSize,
      });
    } else if (!response.ok) {
      const errorText = await response.text();
      throw new AiHttpError(
        `Unable to verify Qdrant collection ${this.collectionName}`,
        response.status,
        errorText,
      );
    }

    this.collectionReady = true;
  }

  async upsert(record: VectorRecord): Promise<void> {
    await this.ensureCollection();

    await requestJson(this.pointsUrl(), {
      method: 'PUT',
      timeoutMs: this.requestTimeoutMs,
      headers: this.headers(),
      body: JSON.stringify({
        points: [
          {
            id: record.id,
            vector: record.vector,
            payload: record.payload,
          },
        ],
      }),
    });
  }

  async getVector(productId: string): Promise<number[]> {
    await this.ensureCollection();

    const response = await requestJson<QdrantRetrieveResponse>(this.pointsUrl(), {
      method: 'POST',
      timeoutMs: this.requestTimeoutMs,
      headers: this.headers(),
      body: JSON.stringify({
        ids: [productId],
        with_vector: true,
        with_payload: false,
      }),
    });

    const vectorValue = response.result?.[0]?.vector;
    if (Array.isArray(vectorValue)) {
      return vectorValue;
    }

    if (vectorValue && Array.isArray(vectorValue.default)) {
      return vectorValue.default;
    }

    throw new AiHttpError(`Vector not found for product ${productId}`, 404);
  }

  async search(vector: number[], limit: number, excludeProductId?: string): Promise<RecommendationResult[]> {
    await this.ensureCollection();

    const response = await requestJson<QdrantSearchResponse>(this.queryUrl(), {
      method: 'POST',
      timeoutMs: this.requestTimeoutMs,
      headers: this.headers(),
      body: JSON.stringify({
        query: vector,
        limit,
        filter: {
          ...(excludeProductId
            ? {
                must_not: [
                  {
                    key: 'id',
                    match: {
                      value: excludeProductId,
                    },
                  },
                ],
              }
            : {}),
        },
        with_payload: true,
        with_vector: false,
      }),
    });

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

  async getPayload(productId: string): Promise<ProductEmbeddingPayload | null> {
    await this.ensureCollection();

    const response = await requestJson<QdrantRetrieveResponse>(this.pointsUrl(), {
      method: 'POST',
      timeoutMs: this.requestTimeoutMs,
      headers: this.headers(),
      body: JSON.stringify({
        ids: [productId],
        with_vector: false,
        with_payload: true,
      }),
    });

    return response.result?.[0]?.payload ?? null;
  }

  private collectionUrl() {
    return `${this.baseUrl}/collections/${this.collectionName}`;
  }

  private pointsUrl() {
    return `${this.collectionUrl()}/points`;
  }

  private queryUrl() {
    return `${this.pointsUrl()}/query`;
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { 'api-key': this.apiKey } : {}),
    };
  }
}
