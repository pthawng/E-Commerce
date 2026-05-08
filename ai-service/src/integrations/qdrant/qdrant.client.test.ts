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
    const client = new QdrantClient('http://qdrant', 'products', 768, 1000);

    await client.searchSimilar([0.1, 0.2], 5, 'product-1');

    const searchRequest = requests.find((request) =>
      request.url.endsWith('/collections/products/points/query'),
    );
    assert.ok(searchRequest);

    const body = JSON.parse(String(searchRequest.init?.body));
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
    const client = new QdrantClient('http://qdrant', 'products', 768, 1000);

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

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
