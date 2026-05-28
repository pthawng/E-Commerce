import assert from 'node:assert/strict';
import test from 'node:test';
import { QdrantClient } from './qdrant.client';

test('QdrantClient excludes the source product by point id', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; init?: RequestInit }> = [];

  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });

    if (String(url).endsWith('/collections/products')) {
      return jsonResponse({ result: { status: 'green' } });
    }

    return jsonResponse({ result: { points: [] } });
  };

  try {
    const client = new QdrantClient(fakeConfig());

    await client.searchSimilar([0.1, 0.2], 5, 'product-1');

    const searchRequest = requests.find((request) =>
      request.url.endsWith('/collections/products/points/query'),
    );
    assert.ok(searchRequest);

    const body = JSON.parse(String(searchRequest.init?.body));
    assert.equal(body.using, 'default');
    assert.deepEqual(body.filter, {
      must_not: [
        {
          has_id: ['product-1'],
        },
      ],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('QdrantClient includes active category and price filters', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; init?: RequestInit }> = [];

  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });

    if (String(url).endsWith('/collections/products')) {
      return jsonResponse({ result: { status: 'green' } });
    }

    return jsonResponse({ result: { points: [] } });
  };

  try {
    const client = new QdrantClient(fakeConfig());

    await client.search([0.1, 0.2], 12, {
      filters: {
        isActive: true,
        category: 'Necklace',
        minPrice: 1000,
        maxPrice: 5000,
      },
    });

    const searchRequest = requests.find((request) =>
      request.url.endsWith('/collections/products/points/query'),
    );
    assert.ok(searchRequest);

    const body = JSON.parse(String(searchRequest.init?.body));
    assert.equal(body.using, 'default');
    assert.deepEqual(body.filter, {
      must: [
        { key: 'isActive', match: { value: true } },
        { key: 'category', match: { value: 'Necklace' } },
        { key: 'price', range: { gte: 1000, lte: 5000 } },
      ],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('QdrantClient uses named dense and sparse vectors for hybrid upsert and search', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; init?: RequestInit }> = [];

  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });

    if (String(url).endsWith('/collections/products')) {
      return jsonResponse({ result: { status: 'green' } });
    }

    return jsonResponse({ result: { points: [] } });
  };

  try {
    const client = new QdrantClient(fakeConfig());

    await client.upsert({
      id: 'product-1',
      vector: [0.1, 0.2],
      sparseVector: { indices: [1], values: [0.8] },
      payload: { id: 'product-1', name: 'Ray Necklace', isActive: true },
    });
    await client.search([0.1, 0.2], 5, {
      sparseVector: { indices: [1], values: [0.8] },
    });

    const upsertRequest = requests.find((request) =>
      request.url.endsWith('/collections/products/points'),
    );
    const searchRequest = requests.find((request) =>
      request.url.endsWith('/collections/products/points/query'),
    );

    assert.ok(upsertRequest);
    assert.ok(searchRequest);

    const upsertBody = JSON.parse(String(upsertRequest.init?.body));
    assert.deepEqual(upsertBody.points[0].vector, {
      default: [0.1, 0.2],
      text: { indices: [1], values: [0.8] },
    });

    const searchBody = JSON.parse(String(searchRequest.init?.body));
    assert.deepEqual(searchBody.prefetch, [
      { query: [0.1, 0.2], using: 'default', limit: 10 },
      { query: { indices: [1], values: [0.8] }, using: 'text', limit: 10 },
    ]);
    assert.deepEqual(searchBody.query, { fusion: 'rrf' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function fakeConfig() {
  return {
    get<T = unknown>(key: string, fallback?: T): T {
      const values: Record<string, unknown> = {
        QDRANT_URL: 'http://qdrant',
        QDRANT_COLLECTION: 'products',
        AI_EMBEDDING_DIMENSIONS: 768,
        AI_REQUEST_TIMEOUT_MS: 1000,
        CIRCUIT_BREAKER_THRESHOLD: 5,
      };

      return (values[key] ?? fallback) as T;
    },
  } as any;
}

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
