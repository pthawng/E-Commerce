import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  ProductEmbeddingPayload,
  RecommendationQuery,
  RecommendationResponse,
  SearchQuery,
  SearchResponse,
} from '../common/types/recommendation.types';
import { SearchEngine } from '../capabilities/search/search.engine';
import { StorefrontRecommendationService } from '../domains/storefront/recommendation/recommendation.service';
import { ChatRequest, ChatResponse, ChatService } from '../domains/storefront/chat/chat.service';

@Controller()
export class AiController {
  constructor(
    private readonly storefrontRecommendation: StorefrontRecommendationService,
    private readonly searchEngine: SearchEngine,
    private readonly chatService: ChatService,
    @InjectQueue('product-embeddings') private readonly embeddingQueue: Queue,
  ) {}

  @Post('chat')
  async handleChat(@Body() request: ChatRequest): Promise<ChatResponse> {
    return this.chatService.handleMessage(request);
  }

  @Get('recommendations')
  async getRecommendations(@Query() query: RecommendationQuery): Promise<RecommendationResponse> {
    return this.storefrontRecommendation.getSimilarProducts(query);
  }

  @Post('search')
  async searchProducts(@Body() query: SearchQuery): Promise<SearchResponse> {
    return this.searchEngine.searchProducts(query);
  }

  @Post('products/embed')
  async embedProduct(@Body() payload: ProductEmbeddingPayload) {
    // Async push to queue for reliable background processing
    await this.embeddingQueue.add('embed-product', payload, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
    });

    return {
      productId: payload.id,
      status: 'queued',
      message: 'Product indexing started in background',
    };
  }
}
