export interface ChatMessage {
  role: 'user' | 'assistant' | 'model' | 'system';
  content: string;
}

export interface ChatProvider {
  generateChat(messages: ChatMessage[]): Promise<string>;
}

export interface EmbeddingProvider {
  createEmbedding(input: string, user?: string): Promise<number[]>;
}
