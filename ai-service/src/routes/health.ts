import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson } from '../common/http';
import { EmbeddingService } from '../core/embedding/embedding.service';
import { QdrantClient } from '../integrations/qdrant/qdrant.client';
import { loadConfig } from '../config/env';

export async function handleHealthCheck(
  request: IncomingMessage,
  response: ServerResponse,
  embeddingService: EmbeddingService,
  qdrantClient: QdrantClient,
): Promise<void> {
  const config = loadConfig();
  const startTime = Date.now();

  try {
    // 1. Check Circuit Breaker State
    const circuitState = embeddingService.getCircuitState();

    // 2. Deep ping Qdrant
    let qdrantStatus = 'connected';
    try {
      await qdrantClient.ensureCollection();
    } catch {
      qdrantStatus = 'disconnected';
    }

    const isHealthy = circuitState !== 'OPEN' && qdrantStatus === 'connected';
    const statusCode = isHealthy ? 200 : 503;

    sendJson(response, statusCode, {
      ok: isHealthy,
      service: 'ai-service',
      version: process.env.SERVICE_VERSION ?? '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      dependencies: {
        embeddingProvider: {
          name: config.embeddingProvider,
          model: config.embeddingProvider === 'gemini'
            ? config.geminiEmbeddingModel
            : config.openAiEmbeddingModel,
          circuitBreaker: circuitState,
        },
        vectorDb: {
          name: 'qdrant',
          status: qdrantStatus,
        },
      },
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
    });
  } catch (error) {
    sendJson(response, 500, { ok: false, error: 'Internal Health Check Failure' });
  }
}
