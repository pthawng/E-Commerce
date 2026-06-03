import { CorrelationIdMiddleware } from '../correlation-id.middleware';

describe('CorrelationIdMiddleware', () => {
  it('uses incoming x-correlation-id and exposes both correlation and request headers', () => {
    const context = { run: jest.fn((_ctx, callback) => callback()) };
    const middleware = new CorrelationIdMiddleware(context as any);
    const response = { setHeader: jest.fn() };
    const next = jest.fn();
    const request = {
      headers: { 'x-correlation-id': 'corr-1' },
      ip: '127.0.0.1',
      method: 'POST',
      originalUrl: '/api/orders',
    };

    middleware.use(request as any, response as any, next);

    expect(response.setHeader).toHaveBeenCalledWith('x-correlation-id', 'corr-1');
    expect(response.setHeader).toHaveBeenCalledWith('x-request-id', 'corr-1');
    expect(context.run).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: 'corr-1',
        requestId: 'corr-1',
        path: '/api/orders',
      }),
      next,
    );
  });

  it('generates a correlation id when none is provided', () => {
    const context = { run: jest.fn((_ctx, callback) => callback()) };
    const middleware = new CorrelationIdMiddleware(context as any);
    const response = { setHeader: jest.fn() };

    middleware.use(
      { headers: {}, method: 'GET', url: '/health' } as any,
      response as any,
      jest.fn(),
    );

    expect(response.setHeader).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
    expect(context.run).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: expect.any(String) }),
      expect.any(Function),
    );
  });
});
