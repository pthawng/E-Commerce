import assert from 'node:assert/strict';
import test from 'node:test';
import { GeminiClient } from './gemini.client';

test('GeminiClient sends typed output dimensionality', async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = '';
  let capturedBody: unknown;

  globalThis.fetch = async (url, init) => {
    capturedUrl = String(url);
    capturedBody = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({ embedding: { values: [0.1, 0.2, 0.3] } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  try {
    const client = new GeminiClient(fakeConfig() as any);
    const embedding = await client.createEmbedding('Ray Paradis');

    assert.deepEqual(embedding, [0.1, 0.2, 0.3]);
    assert.equal(
      capturedUrl,
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent',
    );
    assert.deepEqual(capturedBody, {
      content: { role: 'user', parts: [{ text: 'Ray Paradis' }] },
      output_dimensionality: 768,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function fakeConfig() {
  return {
    get<T = unknown>(key: string, fallback?: T): T {
      const values: Record<string, unknown> = {
        GEMINI_API_KEY: 'api-key',
        GEMINI_EMBEDDING_MODEL: 'gemini-embedding-001',
        GEMINI_CHAT_MODEL: 'gemini-flash-latest',
        AI_REQUEST_TIMEOUT_MS: 1000,
        AI_EMBEDDING_DIMENSIONS: 768,
      };
      return (values[key] ?? fallback) as T;
    },
  };
}
