import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAccessGuard } from './access-jwt.guard';

describe('JwtAccessGuard admin boundary', () => {
  const guard = new JwtAccessGuard({} as Reflector) as unknown as {
    enforceAdminBoundary: (context: any) => void;
  };

  it('rejects customer tokens on admin routes', () => {
    expect(() =>
      guard.enforceAdminBoundary(
        context('/api/admin/orders', { aud: 'customer', userType: 'CUSTOMER' }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('allows admin audience tokens on admin routes', () => {
    expect(() =>
      guard.enforceAdminBoundary(context('/api/admin/orders', { aud: 'admin', userType: 'STAFF' })),
    ).not.toThrow();
  });

  it('does not apply admin boundary to storefront routes', () => {
    expect(() =>
      guard.enforceAdminBoundary(context('/api/orders', { aud: 'customer', userType: 'CUSTOMER' })),
    ).not.toThrow();
  });
});

function context(originalUrl: string, user: unknown) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        originalUrl,
        user,
      }),
    }),
  };
}
