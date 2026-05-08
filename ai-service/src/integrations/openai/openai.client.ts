import { requestJson } from '../../common/http';
import { EmbeddingClient } from '../../core/embedding/embedding-client.interface';

interface OpenAiEmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
}

import { ChatMessage } from '../gemini/gemini.client';

export class OpenAiClient implements EmbeddingClient {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly chatModel: string,
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

  async generateChat(messages: ChatMessage[]): Promise<string> {
    const response = await requestJson<any>('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      timeoutMs: this.requestTimeoutMs * 2,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.chatModel,
        messages,
        temperature: 0.7,
      }),
    });

    return response.choices?.[0]?.message?.content ?? '';
  }
}

