import type { IncomingMessage, ServerResponse } from 'node:http';
import { AiHttpError } from './errors';

export async function requestJson<T>(
  url: string,
  init: RequestInit & { timeoutMs?: number; maxRetries?: number } = {},
): Promise<T> {
  const { timeoutMs = 5000, maxRetries = 2, headers, ...rest } = init;
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Wait before retry (Exponential backoff simple version)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }

      const response = await fetch(url, {
        ...rest,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: rest.signal ?? AbortSignal.timeout(timeoutMs),
      });

      const rawText = await response.text();
      const payload = rawText ? safeJsonParse(rawText) : null;

      if (!response.ok) {
        const error = new AiHttpError(`HTTP ${response.status} for ${url}`, response.status, payload ?? rawText);
        
        // Retry only on 503 (Service Unavailable) or 429 (Rate Limit)
        if ((response.status === 503 || response.status === 429) && attempt < maxRetries) {
          lastError = error;
          continue;
        }
        throw error;
      }

      return payload as T;
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) throw err;
    }
  }
  
  throw lastError;
}

export async function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    throw new AiHttpError('Request body is required', 400);
  }

  return safeJsonParse(Buffer.concat(chunks).toString('utf8')) as T;
}

export function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

export function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new AiHttpError('Invalid JSON payload', 400, error instanceof Error ? error.message : error);
  }
}
