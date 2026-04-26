export function logInfo(event: string, meta: Record<string, unknown> = {}) {
  process.stdout.write(`${JSON.stringify({ level: 'info', event, ...meta, timestamp: new Date().toISOString() })}\n`);
}

export function logWarn(event: string, meta: Record<string, unknown> = {}) {
  process.stdout.write(`${JSON.stringify({ level: 'warn', event, ...meta, timestamp: new Date().toISOString() })}\n`);
}

export function logError(event: string, meta: Record<string, unknown> = {}) {
  process.stderr.write(`${JSON.stringify({ level: 'error', event, ...meta, timestamp: new Date().toISOString() })}\n`);
}
