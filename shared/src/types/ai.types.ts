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

export interface ProductVectorRecord {
  id: string;
  vector?: number[];
  payload: ProductEmbeddingPayload;
}

export interface SimilarProduct {
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
  items: SimilarProduct[];
  source: 'ai' | 'fallback';
  cached: boolean;
}
