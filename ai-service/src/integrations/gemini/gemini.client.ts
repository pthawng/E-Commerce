import { requestJson } from '../../common/http';
import { EmbeddingClient } from '../../core/embedding/embedding-client.interface';

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

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class GeminiClient implements EmbeddingClient {
  constructor(
    private readonly apiKey: string,
    private readonly modelName: string,
    private readonly chatModelName: string,
    private readonly requestTimeoutMs: number,
    private readonly dimensions: number = 768,
  ) {}

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
      role: m.role === 'assistant' ? 'model' : 'user',
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
      timeoutMs: this.requestTimeoutMs * 2, // Chat takes longer
      headers: {
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify(body),
    });

    return result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  private embeddingUrl(): string {
    const model = this.modelName.startsWith('models/')
      ? this.modelName
      : `models/${this.modelName}`;
    return `https://generativelanguage.googleapis.com/v1beta/${model}:embedContent`;
  }

  private chatUrl(): string {
    const model = this.chatModelName.startsWith('models/')
      ? this.chatModelName
      : `models/${this.chatModelName}`;
    return `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent`;
  }

}

