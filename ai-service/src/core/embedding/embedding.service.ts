import { logInfo } from '../../common/logger';
import { ProductEmbeddingPayload } from '../../common/types/recommendation.types';
import { OpenAiClient } from '../../integrations/openai/openai.client';

export class EmbeddingService {
  constructor(
    private readonly openAiClient: OpenAiClient,
    private readonly expectedDimensions?: number,
  ) {}

  buildInput(payload: ProductEmbeddingPayload): string {
    return [
      sanitizeText(payload.name),
      sanitizeText(payload.description),
      payload.category ? `Category: ${sanitizeText(payload.category)}` : '',
    ]
      .filter(Boolean)
      .join('. ');
  }

  async embed(payload: ProductEmbeddingPayload): Promise<number[]> {
    const input = this.buildInput(payload);
    const startedAt = Date.now();
    const vector = await this.openAiClient.createEmbedding(input, payload.id);
    const latencyMs = Date.now() - startedAt;

    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error('Embedding provider returned an empty vector');
    }

    if (this.expectedDimensions && vector.length !== this.expectedDimensions) {
      throw new Error(
        `Unexpected embedding length ${vector.length}; expected ${this.expectedDimensions}`,
      );
    }

    logInfo('embedding.completed', {
      productId: payload.id,
      vectorLength: vector.length,
      latencyMs,
    });

    return vector;
  }
}

function sanitizeText(value?: string): string {
  return (value ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
