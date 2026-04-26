export interface ProductEmbeddingPayload {
  id: string;
  name: string;
  description?: string;
  category?: string;
  slug?: string;
  imageUrl?: string;
  price?: number;
  locale?: string;
  updatedAt?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface VectorRecord {
  id: string;
  vector: number[];
  payload: ProductEmbeddingPayload;
}

export interface RecommendationQuery {
  productId: string;
  limit?: number;
}

export interface RecommendationResult {
  productId: string;
  score: number;
  slug?: string;
  imageUrl?: string;
  name?: string;
  category?: string;
  price?: number;
}

export interface RecommendationResponse {
  productId: string;
  items: RecommendationResult[];
  source: 'ai' | 'fallback';
  cached: boolean;
}

export interface EmbeddingResponse {
  productId: string;
  vectorLength: number;
  latencyMs: number;
}
