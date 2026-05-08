import {
  EmbeddingResponse,
  ProductEmbeddingPayload,
  RecommendationQuery,
  RecommendationResponse,
  SearchQuery,
  SearchResponse,
} from '../common/types/recommendation.types';
import { SearchEngine } from '../capabilities/search/search.engine';
import { StorefrontRecommendationService } from '../domains/storefront/recommendation/recommendation.service';
import { EmbeddingPipeline } from '../pipelines/embedding.pipeline';

import { ChatRequest, ChatResponse, ChatService } from '../domains/storefront/chat/chat.service';

export class AiController {
  constructor(
    private readonly storefrontRecommendation: StorefrontRecommendationService,
    private readonly embeddingPipeline: EmbeddingPipeline,
    private readonly searchEngine: SearchEngine,
    private readonly chatService: ChatService,
  ) {}

  async handleChat(request: ChatRequest): Promise<ChatResponse> {
    return this.chatService.handleMessage(request);
  }


  async getRecommendations(query: RecommendationQuery): Promise<RecommendationResponse> {
    return this.storefrontRecommendation.getSimilarProducts(query);
  }

  async searchProducts(query: SearchQuery): Promise<SearchResponse> {
    return this.searchEngine.searchProducts(query);
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
