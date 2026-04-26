import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { ProductEmbeddingPayload } from '@shared';
import { AiService } from './ai.service';

@Injectable()
export class ProductAiSyncListener {
  private readonly logger = new Logger(ProductAiSyncListener.name);

  constructor(private readonly aiService: AiService) {}

  @OnEvent('product.ai.sync.requested', { suppressErrors: true })
  async handleProductSync(payload: ProductEmbeddingPayload) {
    try {
      await this.aiService.syncProduct(payload);
    } catch (error) {
      this.logger.warn(
        `AI product sync failed for ${payload.id}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}
