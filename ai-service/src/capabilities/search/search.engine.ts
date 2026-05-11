import { Injectable, Logger } from '@nestjs/common';
import { SearchQuery, SearchResponse } from '../../common/types/recommendation.types';
import { EmbeddingService } from '../../core/embedding/embedding.service';
import { RetrievalEngine } from '../retrieval/retrieval.engine';
import { RankingEngine } from '../ranking/ranking.engine';
import { IntentClassifier } from '../intent/intent.classifier';

@Injectable()
export class SearchEngine {
  private readonly logger = new Logger(SearchEngine.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly retrievalEngine: RetrievalEngine,
    private readonly rankingEngine: RankingEngine,
    private readonly intentClassifier: IntentClassifier,
  ) {}

  async searchProducts(query: SearchQuery): Promise<SearchResponse> {
    const startedAt = Date.now();
    const normalizedQuery = query.query.trim();
    const limit = clampLimit(query.limit);
    
    // 1. Query Understanding (Entity Extraction)
    const analysis = await this.intentClassifier.analyze(normalizedQuery);
    const filters = {
      isActive: true,
      ...analysis.entities,
      ...query.filters,
    };

    // 2. Embedding
    const vector = await this.embeddingService.embedText(
      normalizedQuery,
      `search:${normalizedQuery.toLowerCase()}`,
    );
    
    // 3. Hybrid Retrieval (Dense + Sparse)
    const candidates = await this.retrievalEngine.retrieve(
      vector,
      normalizedQuery,
      limit * 2, // Fetch more for reranking
      filters,
    );

    // 4. Reranking
    const rankedItems = await this.rankingEngine.rerank(normalizedQuery, candidates);
    
    const finalItems = rankedItems.slice(0, limit);
    const latencyMs = Date.now() - startedAt;

    return {
      query: normalizedQuery,
      items: finalItems,
      source: 'ai-hybrid',
      cached: false,
      latencyMs,
    };
  }
}

function clampLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit)) return 12;
  return Math.max(1, Math.min(limit, 50));
}
