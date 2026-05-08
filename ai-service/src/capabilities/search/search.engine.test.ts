import assert from 'node:assert/strict';
import test from 'node:test';
import { EmbeddingClient } from '../../core/embedding/embedding-client.interface';
import { EmbeddingService } from '../../core/embedding/embedding.service';
import { QdrantClient } from '../../integrations/qdrant/qdrant.client';
import { SearchEngine } from './search.engine';

test('SearchEngine embeds the query once and searches Qdrant with the vector', async () => {
  const embeddingClient = new CountingEmbeddingClient([0.1, 0.2]);
  const embeddingService = new EmbeddingService(embeddingClient, 2);
  const qdrant = new FakeQdrantClient();
  const engine = new SearchEngine(embeddingService, qdrant as unknown as QdrantClient);

  const result = await engine.searchProducts({
    query: ' diamond necklace ',
    limit: 3,
    filters: { category: 'Necklace' },
  });

  assert.equal(embeddingClient.calls.length, 1);
  assert.equal(embeddingClient.calls[0], 'diamond necklace');
  assert.deepEqual(qdrant.lastVector, [0.1, 0.2]);
  assert.equal(qdrant.lastLimit, 3);
  assert.deepEqual(qdrant.lastOptions, {
    filters: {
      isActive: true,
      category: 'Necklace',
    },
  });
  assert.equal(result.query, 'diamond necklace');
  assert.equal(result.source, 'ai');
  assert.equal(result.cached, false);
  assert.deepEqual(result.items, [
    {
      productId: 'product-1',
      score: 0.9,
      name: 'Diamond Necklace',
    },
  ]);
});

class CountingEmbeddingClient implements EmbeddingClient {
  readonly calls: string[] = [];

  constructor(private readonly vector: number[]) {}

  async createEmbedding(input: string): Promise<number[]> {
    this.calls.push(input);
    return this.vector;
  }
}

class FakeQdrantClient {
  lastVector?: number[];
  lastLimit?: number;
  lastOptions?: unknown;

  async search(vector: number[], limit: number, options: unknown) {
    this.lastVector = vector;
    this.lastLimit = limit;
    this.lastOptions = options;
    return [
      {
        productId: 'product-1',
        score: 0.9,
        name: 'Diamond Necklace',
      },
    ];
  }
}
