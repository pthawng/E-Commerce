import {
  EmbeddingResponse,
  ProductEmbeddingPayload,
  RecommendationQuery,
  RecommendationResponse,
} from '../common/types/recommendation.types';
import { StorefrontRecommendationService } from '../domains/storefront/recommendation/recommendation.service';
import { EmbeddingPipeline } from '../pipelines/embedding.pipeline';

export class AiController {
  constructor(
    private readonly storefrontRecommendation: StorefrontRecommendationService,
    private readonly embeddingPipeline: EmbeddingPipeline,
  ) {}

  async getRecommendations(query: RecommendationQuery): Promise<RecommendationResponse> {
    return this.storefrontRecommendation.getSimilarProducts(query);
  }

  async embedProduct(payload: ProductEmbeddingPayload): Promise<EmbeddingResponse> {
    const startedAt = Date.now();
    const record = await this.embeddingPipeline.processProduct(payload);

    return {
      productId: payload.id,
      vectorLength: record.vector.length,
      latencyMs: Date.now() - startedAt,
    };
  }
}
