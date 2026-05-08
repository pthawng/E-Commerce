import { AiHttpError } from '../common/errors';

export interface AiServiceConfig {
  port: number;
  embeddingProvider: 'gemini' | 'openai';
  openAiApiKey?: string;
  openAiEmbeddingModel: string;
  geminiApiKey?: string;
  geminiEmbeddingModel: string;
  geminiChatModel: string;
  openAiChatModel: string;
  embeddingDimensions?: number;
  qdrantUrl: string;
  qdrantApiKey?: string;
  qdrantCollection: string;
  requestTimeoutMs: number;
  internalToken?: string;
  rateLimitRpm: number;
  rateLimitMaxBuckets: number;
  trustProxyHeaders: boolean;
  circuitBreakerThreshold: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AiServiceConfig {
  const port = Number(env.AI_SERVICE_PORT ?? env.PORT ?? 4100);
  const requestTimeoutMs = Number(env.AI_REQUEST_TIMEOUT_MS ?? 5000);
  const embeddingDimensions = env.AI_EMBEDDING_DIMENSIONS
    ? Number(env.AI_EMBEDDING_DIMENSIONS)
    : undefined;
  const embeddingProvider = resolveEmbeddingProvider(env);

  if (embeddingProvider === 'openai' && !env.OPENAI_API_KEY) {
    throw new AiHttpError('OPENAI_API_KEY is required when AI_EMBEDDING_PROVIDER=openai', 500);
  }

  if (embeddingProvider === 'gemini' && !env.GEMINI_API_KEY) {
    throw new AiHttpError('GEMINI_API_KEY is required when AI_EMBEDDING_PROVIDER=gemini', 500);
  }

  if (!env.QDRANT_URL) {
    throw new AiHttpError('QDRANT_URL is required', 500);
  }

  return {
    port: Number.isFinite(port) ? port : 4100,
    embeddingProvider,
    openAiApiKey: env.OPENAI_API_KEY,
    openAiEmbeddingModel: env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
    openAiChatModel: env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini',
    geminiApiKey: env.GEMINI_API_KEY,
    geminiEmbeddingModel: env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001',
    geminiChatModel: env.GEMINI_CHAT_MODEL ?? 'gemini-flash-latest',
    embeddingDimensions:
      embeddingDimensions && Number.isFinite(embeddingDimensions) ? embeddingDimensions : undefined,
    qdrantUrl: env.QDRANT_URL.replace(/\/$/, ''),
    qdrantApiKey: env.QDRANT_API_KEY,
    qdrantCollection: env.QDRANT_COLLECTION ?? 'products',
    requestTimeoutMs: Number.isFinite(requestTimeoutMs) ? requestTimeoutMs : 5000,
    internalToken: env.INTERNAL_SERVICE_TOKEN,
    rateLimitRpm: positiveNumber(env.RATE_LIMIT_RPM, 60),
    rateLimitMaxBuckets: positiveNumber(env.RATE_LIMIT_MAX_BUCKETS, 10_000),
    trustProxyHeaders: env.TRUST_PROXY_HEADERS === 'true',
    circuitBreakerThreshold: positiveNumber(env.CIRCUIT_BREAKER_THRESHOLD, 5),
  };
}

function resolveEmbeddingProvider(env: NodeJS.ProcessEnv): AiServiceConfig['embeddingProvider'] {
  const provider = env.AI_EMBEDDING_PROVIDER?.toLowerCase();
  if (provider === 'gemini' || provider === 'openai') {
    return provider;
  }

  if (provider) {
    throw new AiHttpError('AI_EMBEDDING_PROVIDER must be either "gemini" or "openai"', 500);
  }

  if (env.GEMINI_API_KEY && env.OPENAI_API_KEY) {
    throw new AiHttpError(
      'AI_EMBEDDING_PROVIDER is required when both GEMINI_API_KEY and OPENAI_API_KEY are configured',
      500,
    );
  }

  if (env.GEMINI_API_KEY) return 'gemini';
  if (env.OPENAI_API_KEY) return 'openai';

  throw new AiHttpError('Either GEMINI_API_KEY or OPENAI_API_KEY is required', 500);
}

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
