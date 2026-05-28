import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { requestJson } from '../../common/http';
import { ChatMessage, ChatProvider, EmbeddingProvider } from '../../core/llm/llm-provider.interface';

interface OpenAiEmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
}

@Injectable()
export class OpenAiClient implements ChatProvider, EmbeddingProvider {
  private readonly apiKey: string;
  private readonly embeddingModel: string;
  private readonly chatModel: string;
  private readonly requestTimeoutMs: number;
  private readonly dimensions?: number;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY')!;
    this.embeddingModel = this.configService.get<string>('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small');
    this.chatModel = this.configService.get<string>('OPENAI_CHAT_MODEL', 'gpt-4o-mini');
    this.requestTimeoutMs = Number(this.configService.get<number>('AI_REQUEST_TIMEOUT_MS', 5000));
    const rawDimensions = this.configService.get<number>('AI_EMBEDDING_DIMENSIONS');
    this.dimensions = rawDimensions ? Number(rawDimensions) : undefined;
  }

  async createEmbedding(input: string, user?: string): Promise<number[]> {
    const response = await requestJson<OpenAiEmbeddingResponse>('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      timeoutMs: this.requestTimeoutMs,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.embeddingModel,
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
        messages: messages.map(m => ({
          role: m.role === 'model' ? 'assistant' : m.role,
          content: m.content
        })),
        temperature: 0.7,
      }),
    });

    return response.choices?.[0]?.message?.content ?? '';
  }
}
