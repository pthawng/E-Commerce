import { AiHttpError } from '../common/errors';

export interface AiServiceConfig {
  port: number;
  openAiApiKey: string;
  openAiEmbeddingModel: string;
  embeddingDimensions?: number;
  qdrantUrl: string;
  qdrantApiKey?: string;
  qdrantCollection: string;
  requestTimeoutMs: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AiServiceConfig {
  const port = Number(env.AI_SERVICE_PORT ?? env.PORT ?? 4100);
  const requestTimeoutMs = Number(env.AI_REQUEST_TIMEOUT_MS ?? 5000);
  const embeddingDimensions = env.AI_EMBEDDING_DIMENSIONS
    ? Number(env.AI_EMBEDDING_DIMENSIONS)
    : undefined;

  if (!env.OPENAI_API_KEY) {
    throw new AiHttpError('OPENAI_API_KEY is required', 500);
  }

  if (!env.QDRANT_URL) {
    throw new AiHttpError('QDRANT_URL is required', 500);
  }

  return {
    port: Number.isFinite(port) ? port : 4100,
    openAiApiKey: env.OPENAI_API_KEY,
    openAiEmbeddingModel: env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
    embeddingDimensions:
      embeddingDimensions && Number.isFinite(embeddingDimensions) ? embeddingDimensions : undefined,
    qdrantUrl: env.QDRANT_URL.replace(/\/$/, ''),
    qdrantApiKey: env.QDRANT_API_KEY,
    qdrantCollection: env.QDRANT_COLLECTION ?? 'products',
    requestTimeoutMs: Number.isFinite(requestTimeoutMs) ? requestTimeoutMs : 5000,
  };
}
