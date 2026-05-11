import { Injectable, Logger } from '@nestjs/common';
import {
  RecommendationQuery,
  RecommendationResult,
} from '../../common/types/recommendation.types';
import { QdrantClient } from '../../integrations/qdrant/qdrant.client';

@Injectable()
export class RecommendationEngine {
  private readonly logger = new Logger(RecommendationEngine.name);

  constructor(private readonly vectorDb: QdrantClient) {}

  async recommend(query: RecommendationQuery): Promise<RecommendationResult[]> {
    const limit = clampLimit(query.limit);
    const vector = await this.vectorDb.getVector(query.productId);
    
    // Fetch a larger candidate pool for scoring/diversity
    const candidates = await this.vectorDb.searchSimilar(vector, limit * 4, query.productId);
    
    // 1. Scoring & Blending (Price tier affinity + Similarity)
    const scoredCandidates = candidates.map(c => ({
      ...c,
      finalScore: this.calculateCompositeScore(c, query),
    }));

    // 2. Diversity Enforcement (Maximal Marginal Relevance - Simplified)
    const diversified = this.applyDiversity(scoredCandidates, limit);

    return diversified;
  }

  private calculateCompositeScore(candidate: RecommendationResult, query: any): number {
    // In a real system, we'd fetch the source product to compare price tiers
    // For now, we use a simple similarity score
    return candidate.score; 
  }

  private applyDiversity(candidates: RecommendationResult[], limit: number): RecommendationResult[] {
    const selected: RecommendationResult[] = [];
    const remaining = [...candidates].sort((a, b) => (b as any).finalScore - (a as any).finalScore);

    while (selected.length < limit && remaining.length > 0) {
      const next = remaining.shift()!;
      
      // Diversity check: avoid too many items from the same category
      const categoryCount = selected.filter(s => s.category === next.category).length;
      if (categoryCount >= 2 && remaining.length > limit - selected.length) {
        // Skip for now if we have other options to ensure diversity
        continue; 
      }
      
      selected.push(next);
    }

    return selected;
  }
}

function clampLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit)) return 5;
  return Math.max(1, Math.min(limit, 10));
}
