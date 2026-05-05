import 'dotenv/config';
import { createServer } from 'node:http';
import { AiController } from './api/ai.controller';
import { AiHttpError } from './common/errors';
import { sendJson } from './common/http';
import { logError, logInfo, logWarn } from './common/logger';
import { loadConfig } from './config/env';
import { RecommendationService } from './capabilities/recommendation/recommendation.service';
import { EmbeddingService } from './core/embedding/embedding.service';
import { StorefrontRecommendationService } from './domains/storefront/recommendation/recommendation.service';
import { GeminiClient } from './integrations/gemini/gemini.client';
import { OpenAiClient } from './integrations/openai/openai.client';
import { QdrantClient } from './integrations/qdrant/qdrant.client';
import { EmbeddingPipeline } from './pipelines/embedding.pipeline';
import { EmbeddingClient } from './core/embedding/embedding-client.interface';
import { handleHealthCheck } from './routes/health';
import { readJsonBodySized, requireInternalAuth } from './common/middleware/auth';
import { ProductEmbeddingSchema, RecommendationQuerySchema } from './common/validation/schemas';
import { applyResponseContext, buildRequestContext } from './common/telemetry/request-context';
import { RateLimiter } from './common/middleware/rate-limit';

const config = loadConfig();

let embeddingClient: EmbeddingClient;
let dimensions = config.embeddingDimensions;

if (config.geminiApiKey) {
  dimensions = dimensions ?? 768; // Default for our vector DB
  embeddingClient = new GeminiClient(config.geminiApiKey, config.geminiEmbeddingModel, dimensions);
} else {
  embeddingClient = new OpenAiClient(
    config.openAiApiKey!,
    config.openAiEmbeddingModel,
    config.requestTimeoutMs,
    config.embeddingDimensions,
  );
  dimensions = dimensions ?? 1536; // OpenAI text-embedding-3-small default
}

const vectorDb = new QdrantClient(
  config.qdrantUrl,
  config.qdrantCollection,
  dimensions,
  config.requestTimeoutMs,
  config.qdrantApiKey,
);
const embeddingService = new EmbeddingService(embeddingClient, dimensions, {
  failureThreshold: config.circuitBreakerThreshold,
});
const embeddingPipeline = new EmbeddingPipeline(embeddingService, vectorDb);
const recommendationEngine = new RecommendationService(vectorDb);
const storefrontRecommendation = new StorefrontRecommendationService(recommendationEngine);
const aiController = new AiController(storefrontRecommendation, embeddingPipeline);
const rateLimiter = new RateLimiter(config.rateLimitRpm);

const server = createServer(async (request, response) => {
  const ctx = buildRequestContext(request);
  applyResponseContext(response, ctx);
  logInfo('ai.request.started', { req: ctx });

  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

  try {
    // 1. Rate Limiting (All routes)
    if (!rateLimiter.middleware(request, response, config.rateLimitRpm)) return;

    // 2. Health Check (Public)
    if (request.method === 'GET' && url.pathname === '/health') {
      await handleHealthCheck(request, response, embeddingService, vectorDb);
      return;
    }

    // 3. Authentication (Internal routes)
    if (config.internalToken && !(await requireInternalAuth(request, response, config.internalToken))) {
      return;
    }

    // 4. Routes
    if (request.method === 'POST' && url.pathname === '/products/embed') {
      const rawPayload = await readJsonBodySized(request);
      const payload = ProductEmbeddingSchema.parse(rawPayload); // Zod Validation
      const result = await aiController.embedProduct(payload);
      sendJson(response, 202, result);
      logInfo('ai.request.completed', { req: ctx, statusCode: 202, durationMs: Date.now() - ctx.startTime });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/recommendations') {
      const rawQuery = {
        productId: url.searchParams.get('productId') ?? undefined,
        limit: url.searchParams.get('limit') ?? undefined,
      };
      const query = RecommendationQuerySchema.parse(rawQuery); // Zod Validation
      const result = await aiController.getRecommendations(query);
      sendJson(response, 200, result);
      logInfo('ai.request.completed', { req: ctx, statusCode: 200, durationMs: Date.now() - ctx.startTime });
      return;
    }

    sendJson(response, 404, { message: 'Not Found' });
    logInfo('ai.request.completed', { req: ctx, statusCode: 404, durationMs: Date.now() - ctx.startTime });
  } catch (error) {
    const httpError = normalizeError(error);
    if (httpError.statusCode >= 500) {
      logError('ai.request.failed', {
        req: ctx,
        message: httpError.message,
        details: httpError.details,
      });
    } else {
      logWarn('ai.request.rejected', {
        req: ctx,
        message: httpError.message,
        details: httpError.details,
      });
    }

    sendJson(response, httpError.statusCode, {
      message: httpError.message,
      details: httpError.details ?? null,
    });
  }
});

function normalizeError(error: unknown): AiHttpError {
  if (error instanceof AiHttpError) return error;
  if (error instanceof Error) {
    if (error.name === 'ZodError') {
      return new AiHttpError('Validation Error', 400, JSON.parse(error.message));
    }
    return new AiHttpError(error.message, 500);
  }
  return new AiHttpError('Unexpected AI service error', 500, error);
}

// Graceful Shutdown Support
let isShuttingDown = false;

function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logInfo('ai-service.shutting_down', { message: 'Received termination signal, draining requests...' });

  server.close(() => {
    logInfo('ai-service.shutdown_complete', { message: 'All connections closed.' });
    process.exit(0);
  });

  // Force exit after 10s if connections linger
  setTimeout(() => {
    logError('ai-service.force_exit', { message: 'Forced shutdown after timeout.' });
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.listen(config.port, () => {
  logInfo('ai-service.started', {
    port: config.port,
    model: config.geminiApiKey ? config.geminiEmbeddingModel : config.openAiEmbeddingModel,
    qdrantCollection: config.qdrantCollection,
    version: process.env.SERVICE_VERSION ?? '1.0.0',
    hardening: {
      auth: !!config.internalToken,
      rateLimit: config.rateLimitRpm,
    }
  });
});
