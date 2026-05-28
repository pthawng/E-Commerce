import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfGuard } from './csrf.guard';

describe('CsrfGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new CsrfGuard(reflector);

  beforeEach(() => {
    jest.clearAllMocks();
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
  });

  it('allows safe methods without a token', () => {
    expect(guard.canActivate(context({ method: 'GET' }))).toBe(true);
  });

  it('rejects mutating requests without csrf token', () => {
    expect(() => guard.canActivate(context({ method: 'POST' }))).toThrow(ForbiddenException);
  });

  it('rejects mutating requests with a mismatched csrf token', () => {
    expect(() =>
      guard.canActivate(
        context({
          method: 'POST',
          headers: { 'x-csrf-token': 'header-token' },
          cookies: { csrfToken: 'cookie-token' },
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows mutating requests when double submit tokens match', () => {
    expect(
      guard.canActivate(
        context({
          method: 'POST',
          headers: { 'x-csrf-token': 'csrf-token' },
          cookies: { csrfToken: 'csrf-token' },
        }),
      ),
    ).toBe(true);
  });
});

function context(request: {
  method: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
}) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: request.headers ?? {},
        cookies: request.cookies,
        method: request.method,
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}
