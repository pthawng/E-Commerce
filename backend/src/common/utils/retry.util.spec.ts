import { withRetry } from './retry.util';

describe('withRetry', () => {
  it('retries PostgreSQL lock-not-available errors', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('lock not available'), { code: '55P03' }))
      .mockResolvedValue('ok');

    await expect(withRetry(operation, { maxRetries: 2, backoffMs: 0 })).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('retries NOWAIT lock errors by message', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('could not obtain lock on row in relation NOWAIT'))
      .mockResolvedValue('ok');

    await expect(withRetry(operation, { maxRetries: 2, backoffMs: 0 })).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-transient errors', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('validation failed'));

    await expect(withRetry(operation, { maxRetries: 3, backoffMs: 0 })).rejects.toThrow(
      'validation failed',
    );
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
