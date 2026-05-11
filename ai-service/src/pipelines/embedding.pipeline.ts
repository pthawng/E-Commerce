import { Injectable } from '@nestjs/common';
import { ProductEmbeddingPayload, VectorRecord } from '../common/types/recommendation.types';
import { EmbeddingService } from '../core/embedding/embedding.service';
import { QdrantClient } from '../integrations/qdrant/qdrant.client';

@Injectable()
export class EmbeddingPipeline {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorDb: QdrantClient,
  ) {}

  async processProduct(product: ProductEmbeddingPayload): Promise<VectorRecord> {
    if (!product.material) {
      product.material = extractMaterial(product.name, product.description);
    }
    if (!product.gender) {
      product.gender = extractGender(product.name, product.description);
    }

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

function extractMaterial(name: string, description?: string): string | undefined {
  const text = `${name} ${description ?? ''}`.toLowerCase();
  if (text.includes('kim cương') || text.includes('diamond')) return 'Diamond';
  if (text.includes('vàng') || text.includes('gold')) return 'Gold';
  if (text.includes('bạc') || text.includes('silver')) return 'Silver';
  if (text.includes('ngọc lục bảo') || text.includes('emerald')) return 'Emerald';
  if (text.includes('hồng ngọc') || text.includes('ruby')) return 'Ruby';
  if (text.includes('sapphire') || text.includes('lam ngọc')) return 'Sapphire';
  return undefined;
}

function extractGender(name: string, description?: string): string | undefined {
  const text = `${name} ${description ?? ''}`.toLowerCase();
  if (text.includes('nam') || text.includes('men')) return 'Men';
  if (text.includes('nữ') || text.includes('women')) return 'Women';
  return 'Unisex';
}
