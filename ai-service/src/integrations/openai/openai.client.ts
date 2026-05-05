import { requestJson } from '../../common/http';
import { EmbeddingClient } from '../../core/embedding/embedding-client.interface';

interface OpenAiEmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
}

export class OpenAiClient implements EmbeddingClient {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly requestTimeoutMs: number,
    private readonly dimensions?: number,
  ) {}

  async createEmbedding(input: string, user?: string): Promise<number[]> {
    const response = await requestJson<OpenAiEmbeddingResponse>('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      timeoutMs: this.requestTimeoutMs,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input,
        encoding_format: 'float',
        ...(this.dimensions ? { dimensions: this.dimensions } : {}),
        ...(user ? { user } : {}),
      }),
    });

    return response.data?.[0]?.embedding ?? [];
  }
}
