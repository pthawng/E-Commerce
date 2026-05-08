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
    const client = new GeminiClient('api-key', 'gemini-embedding-001', 'gemini-flash-latest', 1000, 768);
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
