import { Logger } from '@nestjs/common';

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
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Only retry on certain errors (e.g., Prisma deadlock/timeout P2034, P2024)
      const isRetryable =
        error.code === 'P2034' || error.code === 'P2024' || error.message?.includes('NOWAIT');

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const baseWaitTime = backoffMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.1 * baseWaitTime;
      const waitTime = Math.round(baseWaitTime + jitter);
      logger?.warn(
        `[${context}] Attempt ${attempt} failed. Retrying in ${waitTime}ms... Error: ${error.message}`,
      );

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}
