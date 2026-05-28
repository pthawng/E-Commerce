import assert from 'node:assert/strict';
import test from 'node:test';
import { EmbeddingService } from '../../core/embedding/embedding.service';
import { EmbeddingProvider } from '../../core/llm/llm-provider.interface';
import { SearchEngine } from './search.engine';

test('SearchEngine embeds the query once and searches Qdrant with the vector', async () => {
  const embeddingClient = new CountingEmbeddingClient([0.1, 0.2]);
  const embeddingService = new EmbeddingService(
    embeddingClient,
    new FakeRedis() as any,
    fakeConfig() as any,
  );
  const retrieval = new FakeRetrievalEngine();
  const ranking = new FakeRankingEngine();
  const intent = new FakeIntentClassifier();
  const engine = new SearchEngine(
    embeddingService,
    retrieval as any,
    ranking as any,
    intent as any,
  );

  const result = await engine.searchProducts({
    query: ' diamond necklace ',
    limit: 3,
    filters: { category: 'Necklace' },
  });

  assert.equal(embeddingClient.calls.length, 1);
  assert.equal(embeddingClient.calls[0], 'diamond necklace');
  assert.deepEqual(retrieval.lastVector, [0.1, 0.2]);
  assert.equal(retrieval.lastQuery, 'diamond necklace');
  assert.equal(retrieval.lastLimit, 6);
  assert.deepEqual(retrieval.lastFilters, {
    isActive: true,
    category: 'Necklace',
  });
  assert.equal(result.query, 'diamond necklace');
  assert.equal(result.source, 'ai-hybrid');
  assert.equal(result.cached, false);
  assert.deepEqual(result.items, [
    {
      productId: 'product-1',
      score: 0.9,
      name: 'Diamond Necklace',
    },
  ]);
});

class CountingEmbeddingClient implements EmbeddingProvider {
  readonly calls: string[] = [];

  constructor(private readonly vector: number[]) {}

  async createEmbedding(input: string): Promise<number[]> {
    this.calls.push(input);
    return this.vector;
  }
}

class FakeRedis {
  async get() {
    return null;
  }

  async set() {
    return 'OK';
  }
}

class FakeRetrievalEngine {
  lastVector?: number[];
  lastLimit?: number;
  lastQuery?: string;
  lastFilters?: unknown;

  async retrieve(vector: number[], query: string, limit: number, filters: unknown) {
    this.lastVector = vector;
    this.lastLimit = limit;
    this.lastQuery = query;
    this.lastFilters = filters;
    return [
      {
        productId: 'product-1',
        score: 0.9,
        name: 'Diamond Necklace',
      },
    ];
  }
}

class FakeRankingEngine {
  async rerank(_query: string, candidates: unknown[]) {
    return candidates;
  }
}

class FakeIntentClassifier {
  async analyze() {
    return {
      intent: 'PRODUCT_DISCOVERY',
      entities: {},
      confidence: 0.5,
    };
  }
}

function fakeConfig() {
  return {
    get<T = unknown>(key: string, fallback?: T): T {
      const values: Record<string, unknown> = {
        AI_EMBEDDING_DIMENSIONS: 2,
        CIRCUIT_BREAKER_THRESHOLD: 5,
      };
      return (values[key] ?? fallback) as T;
    },
  };
}
