import { GoogleGenerativeAI } from '@google/generative-ai';
import { EmbeddingClient } from '../../core/embedding/embedding-client.interface';

export class GeminiClient implements EmbeddingClient {
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private readonly apiKey: string,
    private readonly modelName: string,
    private readonly dimensions: number = 768,
  ) {
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  async createEmbedding(input: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });
    // Note: older SDKs use `outputDimensionality` inside the second argument or model config
    // Let's pass it in the request payload
    const result = await model.embedContent({
      content: { role: 'user', parts: [{ text: input }] },
      // Some versions support taskType and outputDimensionality directly
      // Cast to any to avoid type errors if @types don't fully support it yet
      ...( { outputDimensionality: this.dimensions } as any )
    });
    return result.embedding.values;
  }
}
