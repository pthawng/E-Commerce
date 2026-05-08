import { logInfo } from '../../common/logger';
import { SearchQuery, SearchResponse } from '../../common/types/recommendation.types';
import { EmbeddingService } from '../../core/embedding/embedding.service';
import { QdrantClient } from '../../integrations/qdrant/qdrant.client';

export class SearchEngine {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorDb: QdrantClient,
  ) {}

  async searchProducts(query: SearchQuery): Promise<SearchResponse> {
    const startedAt = Date.now();
    const normalizedQuery = query.query.trim();
    const limit = clampLimit(query.limit);
    const vector = await this.embeddingService.embedText(
      normalizedQuery,
      `search:${normalizedQuery.toLowerCase()}`,
    );
    const items = await this.vectorDb.search(vector, limit, {
      filters: {
        isActive: true,
        ...query.filters,
      },
    });

    const latencyMs = Date.now() - startedAt;
    logInfo('search.completed', {
      query: normalizedQuery,
      limit,
      resultCount: items.length,
      latencyMs,
    });

    return {
      query: normalizedQuery,
      items,
      source: 'ai',
      cached: false,
      latencyMs,
    };
  }
}

function clampLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit)) return 12;
  return Math.max(1, Math.min(limit, 50));
}
