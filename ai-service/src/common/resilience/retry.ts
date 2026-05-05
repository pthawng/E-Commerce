import { AiHttpError } from '../errors';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 2000,
};

function shouldRetry(error: unknown): boolean {
  // Never retry client errors (4xx)
  if (error instanceof AiHttpError) {
    return error.statusCode >= 500;
  }
  // Retry network/timeout errors
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('fetch') ||
      msg.includes('network') ||
      msg.includes('timeout') ||
      msg.includes('econnreset') ||
      msg.includes('econnrefused')
    );
  }
  return false;
}

function jitter(ms: number): number {
  return ms + Math.floor(Math.random() * ms * 0.2);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!shouldRetry(err) || attempt === opts.maxAttempts - 1) {
        break;
      }
      const delay = Math.min(
        jitter(opts.baseDelayMs * Math.pow(2, attempt)),
        opts.maxDelayMs,
      );
      await sleep(delay);
    }
  }

  throw lastError;
}
