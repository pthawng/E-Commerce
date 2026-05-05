import { RequestContext } from './telemetry/request-context';

export interface LogMeta extends Record<string, unknown> {
  req?: RequestContext;
}

function formatMeta(meta: LogMeta = {}) {
  const { req, ...rest } = meta;
  return {
    ...rest,
    ...(req ? { requestId: req.requestId, path: req.path, method: req.method } : {}),
    serviceName: 'ai-service',
    serviceVersion: process.env.SERVICE_VERSION ?? '1.0.0',
    timestamp: new Date().toISOString(),
  };
}

export function logInfo(event: string, meta?: LogMeta) {
  process.stdout.write(`${JSON.stringify({ level: 'info', event, ...formatMeta(meta) })}\n`);
}

export function logWarn(event: string, meta?: LogMeta) {
  process.stdout.write(`${JSON.stringify({ level: 'warn', event, ...formatMeta(meta) })}\n`);
}

export function logError(event: string, meta?: LogMeta) {
  process.stderr.write(`${JSON.stringify({ level: 'error', event, ...formatMeta(meta) })}\n`);
}
