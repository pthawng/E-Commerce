import { AiHttpError } from '../common/errors';

export interface AiServiceConfig {
  port: number;
  openAiApiKey?: string;
  openAiEmbeddingModel: string;
  geminiApiKey?: string;
  geminiEmbeddingModel: string;
  embeddingDimensions?: number;
  qdrantUrl: string;
  qdrantApiKey?: string;
  qdrantCollection: string;
  requestTimeoutMs: number;
  internalToken?: string;
  rateLimitRpm: number;
  circuitBreakerThreshold: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AiServiceConfig {
  const port = Number(env.AI_SERVICE_PORT ?? env.PORT ?? 4100);
  const requestTimeoutMs = Number(env.AI_REQUEST_TIMEOUT_MS ?? 5000);
  const embeddingDimensions = env.AI_EMBEDDING_DIMENSIONS
    ? Number(env.AI_EMBEDDING_DIMENSIONS)
    : undefined;

  if (!env.OPENAI_API_KEY && !env.GEMINI_API_KEY) {
    throw new AiHttpError('Either OPENAI_API_KEY or GEMINI_API_KEY is required', 500);
  }

  if (!env.QDRANT_URL) {
    throw new AiHttpError('QDRANT_URL is required', 500);
  }

  return {
    port: Number.isFinite(port) ? port : 4100,
    openAiApiKey: env.OPENAI_API_KEY,
    openAiEmbeddingModel: env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
    geminiApiKey: env.GEMINI_API_KEY,
    geminiEmbeddingModel: env.GEMINI_EMBEDDING_MODEL ?? 'text-embedding-004',
    embeddingDimensions:
      embeddingDimensions && Number.isFinite(embeddingDimensions) ? embeddingDimensions : undefined,
    qdrantUrl: env.QDRANT_URL.replace(/\/$/, ''),
    qdrantApiKey: env.QDRANT_API_KEY,
    qdrantCollection: env.QDRANT_COLLECTION ?? 'products',
    requestTimeoutMs: Number.isFinite(requestTimeoutMs) ? requestTimeoutMs : 5000,
    internalToken: env.INTERNAL_SERVICE_TOKEN,
    rateLimitRpm: Number(env.RATE_LIMIT_RPM ?? 60),
    circuitBreakerThreshold: Number(env.CIRCUIT_BREAKER_THRESHOLD ?? 5),
  };
}
