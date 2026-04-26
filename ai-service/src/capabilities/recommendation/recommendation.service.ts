import { logInfo } from '../../common/logger';
import {
  RecommendationQuery,
  RecommendationResponse,
} from '../../common/types/recommendation.types';
import { QdrantClient } from '../../integrations/qdrant/qdrant.client';

export class RecommendationService {
  constructor(private readonly vectorDb: QdrantClient) {}

  async getSimilarProducts(query: RecommendationQuery): Promise<RecommendationResponse> {
    const startedAt = Date.now();
    const limit = clampLimit(query.limit);
    const vector = await this.vectorDb.getVector(query.productId);
    const candidates = await this.vectorDb.search(vector, limit + 1, query.productId);
    const items = candidates
      .filter((candidate) => candidate.productId !== query.productId)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);

    logInfo('recommendation.search.completed', {
      productId: query.productId,
      limit,
      resultCount: items.length,
      latencyMs: Date.now() - startedAt,
    });

    return {
      productId: query.productId,
      items,
      source: 'ai',
      cached: false,
    };
  }
}

function clampLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit)) return 5;
  return Math.max(1, Math.min(limit, 10));
}
