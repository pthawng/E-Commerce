import type { IncomingMessage, ServerResponse } from 'node:http';
import { AiHttpError } from '../errors';

const MAX_BODY_BYTES = 64 * 1024; // 64KB hard cap

export async function requireInternalAuth(
  request: IncomingMessage,
  response: ServerResponse,
  token: string,
): Promise<boolean> {
  const provided = request.headers['x-internal-token'];
  if (!provided || provided !== token) {
    response.statusCode = 401;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify({ message: 'Unauthorized' }));
    return false;
  }
  return true;
}

export async function readJsonBodySized<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buf.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      throw new AiHttpError('Request body too large (max 64KB)', 413);
    }
    chunks.push(buf);
  }

  if (chunks.length === 0) {
    throw new AiHttpError('Request body is required', 400);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new AiHttpError('Invalid JSON payload', 400);
  }
}
