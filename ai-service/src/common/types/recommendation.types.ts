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
  material?: string;
  gender?: string;
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
  source: 'ai' | 'fallback' | 'ai-diversified';
  cached: boolean;
}

export interface EmbeddingResponse {
  productId: string;
  vectorLength: number;
  latencyMs: number;
}

export interface ProductSearchFilters {
  isActive?: boolean;
  category?: string;
  material?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface SearchQuery {
  query: string;
  limit?: number;
  filters?: ProductSearchFilters;
}

export interface ProductSearchResult {
  productId: string;
  score: number;
  slug?: string;
  imageUrl?: string;
  name?: string;
  category?: string;
  price?: number;
}

export interface SearchResponse {
  query: string;
  items: ProductSearchResult[];
  source: 'ai' | 'fallback' | 'ai-hybrid';
  cached: boolean;
  latencyMs: number;
}
