export interface EmbeddingClient {
  createEmbedding(input: string, user?: string): Promise<number[]>;
}
