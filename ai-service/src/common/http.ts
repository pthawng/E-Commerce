import type { IncomingMessage, ServerResponse } from 'node:http';
import { AiHttpError } from './errors';

export async function requestJson<T>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const { timeoutMs = 5000, headers, ...rest } = init;
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
    throw new AiHttpError(`HTTP ${response.status} for ${url}`, response.status, payload ?? rawText);
  }

  return payload as T;
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
