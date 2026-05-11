import { Injectable, Logger } from '@nestjs/common';
import {
  RecommendationQuery,
  RecommendationResponse,
} from '../../common/types/recommendation.types';
import { RecommendationEngine } from './recommendation.engine';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(private readonly engine: RecommendationEngine) {}

  async getSimilarProducts(query: RecommendationQuery): Promise<RecommendationResponse> {
    const startedAt = Date.now();
    const items = await this.engine.recommend(query);

    return {
      productId: query.productId,
      items,
      source: 'ai-diversified',
      cached: false,
    };
  }
}
