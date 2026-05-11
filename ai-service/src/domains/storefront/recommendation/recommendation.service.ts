import { Injectable } from '@nestjs/common';
import {
  RecommendationQuery,
  RecommendationResponse,
} from '../../../common/types/recommendation.types';
import { RecommendationService } from '../../../capabilities/recommendation/recommendation.service';

@Injectable()
export class StorefrontRecommendationService {
  constructor(private readonly recommendationEngine: RecommendationService) {}

  async getSimilarProducts(query: RecommendationQuery): Promise<RecommendationResponse> {
    return this.recommendationEngine.getSimilarProducts(query);
  }
}
