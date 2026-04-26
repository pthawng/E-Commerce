import { ProductEmbeddingPayload, VectorRecord } from '../common/types/recommendation.types';
import { EmbeddingService } from '../core/embedding/embedding.service';
import { QdrantClient } from '../integrations/qdrant/qdrant.client';

export class EmbeddingPipeline {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorDb: QdrantClient,
  ) {}

  async processProduct(product: ProductEmbeddingPayload): Promise<VectorRecord> {
    const vector = await this.embeddingService.embed(product);

    const record: VectorRecord = {
      id: product.id,
      vector,
      payload: product,
    };

    await this.vectorDb.upsert(record);
    return record;
  }
}
