import { Logger } from '@nestjs/common';

const RETRYABLE_ERROR_CODES = new Set(['P2034', 'P2024', '55P03', '40P01', '40001']);

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return String(error);
}

function isRetryableError(error: unknown): boolean {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);

  return (
    (code !== undefined && RETRYABLE_ERROR_CODES.has(code)) ||
    message.includes('NOWAIT') ||
    message.includes('lock_not_available') ||
    message.includes('could not obtain lock')
  );
}

/**
 * withRetry
 *
 * Executes a function with a retry strategy.
 * Useful for handling transient failures like database deadlocks or network timeouts.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    backoffMs?: number;
    logger?: Logger;
    context?: string;
  } = {},
): Promise<T> {
  const { maxRetries = 3, backoffMs = 50, logger, context = 'Retry' } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isRetryable = isRetryableError(error);

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const baseWaitTime = backoffMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.1 * baseWaitTime;
      const waitTime = Math.round(baseWaitTime + jitter);
      logger?.warn(
        `[${context}] Attempt ${attempt} failed. Retrying in ${waitTime}ms... Error: ${getErrorMessage(error)}`,
      );

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError ?? new Error('Retry failed without an error');
}
