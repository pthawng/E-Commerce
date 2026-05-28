import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { requestJson } from '../../common/http';
import { ChatMessage, ChatProvider, EmbeddingProvider } from '../../core/llm/llm-provider.interface';

interface GeminiEmbeddingResponse {
  embedding?: {
    values?: number[];
  };
}

interface GeminiEmbeddingRequest {
  content: {
    role: 'user';
    parts: Array<{ text: string }>;
  };
  output_dimensionality?: number;
}

@Injectable()
export class GeminiClient implements ChatProvider, EmbeddingProvider {
  private readonly apiKey: string;
  private readonly embeddingModel: string;
  private readonly chatModel: string;
  private readonly requestTimeoutMs: number;
  private readonly dimensions: number;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY')!;
    this.embeddingModel = this.configService.get<string>('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-001');
    this.chatModel = this.configService.get<string>('GEMINI_CHAT_MODEL', 'gemini-flash-latest');
    this.requestTimeoutMs = Number(this.configService.get<number>('AI_REQUEST_TIMEOUT_MS', 5000));
    this.dimensions = Number(this.configService.get<number>('AI_EMBEDDING_DIMENSIONS', 768));
  }

  async createEmbedding(input: string): Promise<number[]> {
    const request: GeminiEmbeddingRequest = {
      content: { role: 'user', parts: [{ text: input }] },
      output_dimensionality: this.dimensions,
    };

    const result = await requestJson<GeminiEmbeddingResponse>(this.embeddingUrl(), {
      method: 'POST',
      timeoutMs: this.requestTimeoutMs,
      headers: {
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify(request),
    });

    return result.embedding?.values ?? [];
  }

  async generateChat(messages: ChatMessage[]): Promise<string> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const contents = chatMessages.map((m) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body: any = {
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };

    if (systemMessage) {
      body.system_instruction = {
        parts: [{ text: systemMessage.content }],
      };
    }

    const result = await requestJson<any>(this.chatUrl(), {
      method: 'POST',
      timeoutMs: this.requestTimeoutMs * 2,
      headers: {
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify(body),
    });

    return result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  private embeddingUrl(): string {
    const model = this.embeddingModel.startsWith('models/')
      ? this.embeddingModel
      : `models/${this.embeddingModel}`;
    return `https://generativelanguage.googleapis.com/v1beta/${model}:embedContent`;
  }

  private chatUrl(): string {
    const model = this.chatModel.startsWith('models/')
      ? this.chatModel
      : `models/${this.chatModel}`;
    return `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent`;
  }
}
