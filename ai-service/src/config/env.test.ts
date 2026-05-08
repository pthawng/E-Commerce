import assert from 'node:assert/strict';
import test from 'node:test';
import { AiHttpError } from '../common/errors';
import { loadConfig } from './env';

const baseEnv = {
  QDRANT_URL: 'http://localhost:6333/',
};

test('loadConfig uses explicit Gemini embedding provider', () => {
  const config = loadConfig({
    ...baseEnv,
    AI_EMBEDDING_PROVIDER: 'gemini',
    GEMINI_API_KEY: 'gemini-key',
    OPENAI_API_KEY: 'openai-key',
  });

  assert.equal(config.embeddingProvider, 'gemini');
  assert.equal(config.qdrantUrl, 'http://localhost:6333');
  assert.equal(config.geminiEmbeddingModel, 'gemini-embedding-001');
});

test('loadConfig rejects ambiguous provider configuration', () => {
  assert.throws(
    () =>
      loadConfig({
        ...baseEnv,
        GEMINI_API_KEY: 'gemini-key',
        OPENAI_API_KEY: 'openai-key',
      }),
    (error) =>
      error instanceof AiHttpError &&
      error.message.includes('AI_EMBEDDING_PROVIDER is required'),
  );
});

test('loadConfig requires the key for the selected provider', () => {
  assert.throws(
    () =>
      loadConfig({
        ...baseEnv,
        AI_EMBEDDING_PROVIDER: 'openai',
        GEMINI_API_KEY: 'gemini-key',
      }),
    (error) =>
      error instanceof AiHttpError &&
      error.message.includes('OPENAI_API_KEY is required'),
  );
});
