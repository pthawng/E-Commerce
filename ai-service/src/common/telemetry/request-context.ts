import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export interface RequestContext {
  requestId: string;
  startTime: number;
  method: string;
  path: string;
}

export function buildRequestContext(request: IncomingMessage): RequestContext {
  const requestId =
    (request.headers['x-request-id'] as string | undefined) ?? randomUUID();
  const url = new URL(
    request.url ?? '/',
    `http://${request.headers.host ?? 'localhost'}`,
  );

  return {
    requestId,
    startTime: Date.now(),
    method: request.method ?? 'UNKNOWN',
    path: url.pathname,
  };
}

export function applyResponseContext(
  response: ServerResponse,
  ctx: RequestContext,
): void {
  response.setHeader('X-Request-ID', ctx.requestId);
}
