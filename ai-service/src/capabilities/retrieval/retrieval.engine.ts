import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '../../integrations/qdrant/qdrant.client';
import { ProductSearchResult, ProductSearchFilters } from '../../common/types/recommendation.types';

@Injectable()
export class RetrievalEngine {
  private readonly logger = new Logger(RetrievalEngine.name);

  constructor(private readonly vectorDb: QdrantClient) {}

  async retrieve(
    denseVector: number[],
    queryText: string,
    limit: number,
    filters?: ProductSearchFilters,
  ): Promise<ProductSearchResult[]> {
    // Generate simple sparse vector (term frequency based)
    const sparseVector = this.generateSparseVector(queryText);

    return this.vectorDb.search(denseVector, limit, {
      filters,
      sparseVector,
    });
  }

  /**
   * Simple term-frequency based sparse vector generator.
   * In a real production system, this would use SPLADE or a learned sparse encoder.
   */
  private generateSparseVector(text: string): { indices: number[]; values: number[] } {
    const tokens = text.toLowerCase().split(/[\s,.-]+/).filter(t => t.length > 1);
    const counts = new Map<string, number>();
    
    for (const token of tokens) {
      counts.set(token, (counts.get(token) || 0) + 1);
    }

    const indices: number[] = [];
    const values: number[] = [];

    // Simple deterministic hash for demo purposes. 
    // Real systems use a vocabulary index.
    for (const [token, count] of counts.entries()) {
      indices.push(this.hashString(token));
      values.push(count);
    }

    return { indices, values };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash) % 1000000;
  }
}
