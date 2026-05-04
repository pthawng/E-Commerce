import 'dotenv/config';
import { createServer } from 'node:http';
import { AiController } from './api/ai.controller';
import { AiHttpError } from './common/errors';
import { readJsonBody, sendJson } from './common/http';
import { logError, logInfo, logWarn } from './common/logger';
import {
  ProductEmbeddingPayload,
  RecommendationQuery,
} from './common/types/recommendation.types';
import { loadConfig } from './config/env';
import { RecommendationService } from './capabilities/recommendation/recommendation.service';
import { EmbeddingService } from './core/embedding/embedding.service';
import { StorefrontRecommendationService } from './domains/storefront/recommendation/recommendation.service';
import { OpenAiClient } from './integrations/openai/openai.client';
import { QdrantClient } from './integrations/qdrant/qdrant.client';
import { EmbeddingPipeline } from './pipelines/embedding.pipeline';

const config = loadConfig();
const openAiClient = new OpenAiClient(
  config.openAiApiKey,
  config.openAiEmbeddingModel,
  config.requestTimeoutMs,
  config.embeddingDimensions,
);
const vectorDb = new QdrantClient(
  config.qdrantUrl,
  config.qdrantCollection,
  config.embeddingDimensions ?? 1536,
  config.requestTimeoutMs,
  config.qdrantApiKey,
);
const embeddingService = new EmbeddingService(openAiClient, config.embeddingDimensions ?? 1536);
const embeddingPipeline = new EmbeddingPipeline(embeddingService, vectorDb);
const recommendationEngine = new RecommendationService(vectorDb);
const storefrontRecommendation = new StorefrontRecommendationService(recommendationEngine);
const aiController = new AiController(storefrontRecommendation, embeddingPipeline);

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

  try {
    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/products/embed') {
      const payload = await readJsonBody<ProductEmbeddingPayload>(request);
      const result = await aiController.embedProduct(payload);
      sendJson(response, 202, result);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/recommendations') {
      const query: RecommendationQuery = {
        productId: url.searchParams.get('productId') ?? '',
        limit: Number(url.searchParams.get('limit') ?? 5),
      };

      if (!query.productId) {
        throw new AiHttpError('productId is required', 400);
      }

      const result = await aiController.getRecommendations(query);
      sendJson(response, 200, result);
      return;
    }

    sendJson(response, 404, { message: 'Not Found' });
  } catch (error) {
    const httpError = normalizeError(error);
    if (httpError.statusCode >= 500) {
      logError('ai.request.failed', {
        method: request.method,
        path: url.pathname,
        message: httpError.message,
        details: httpError.details,
      });
    } else {
      logWarn('ai.request.rejected', {
        method: request.method,
        path: url.pathname,
        message: httpError.message,
      });
    }

    sendJson(response, httpError.statusCode, {
      message: httpError.message,
      details: httpError.details ?? null,
    });
  }
});

server.listen(config.port, () => {
  logInfo('ai-service.started', {
    port: config.port,
    model: config.openAiEmbeddingModel,
    qdrantCollection: config.qdrantCollection,
  });
});

function normalizeError(error: unknown): AiHttpError {
  if (error instanceof AiHttpError) {
    return error;
  }

  if (error instanceof Error) {
    return new AiHttpError(error.message, 500);
  }

  return new AiHttpError('Unexpected AI service error', 500, error);
}
