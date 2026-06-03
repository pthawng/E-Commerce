import { IS_OPTIONAL_AUTH_KEY } from '@common/decorators/optional-auth.decorator';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import { SKIP_JWT_AUTH_KEY } from '@common/decorators/skip-jwt-auth.decorator';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAccessGuard sẽ dùng strategy 'jwt-access'
 */
@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check for @Public() - Skip all auth and cross-cutting auth guards.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. Check for @SkipJwtAuth() - Skip only the global storefront JWT guard.
    // Route-specific guards, CSRF, throttling, and interceptors still run.
    const skipJwtAuth = this.reflector.getAllAndOverride<boolean>(SKIP_JWT_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipJwtAuth) {
      return true;
    }

    // 3. Check for @OptionalAuth() - Mark for non-blocking auth
    const isOptional = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Attach isOptional to the request so handleRequest can access it
    const request = context.switchToHttp().getRequest();
    request['isOptionalAuth'] = isOptional;

    // Execute standard Passport validation
    // If isOptional is true, we always return true even if passport fails
    try {
      const canActivate = (await super.canActivate(context)) as boolean;
      if (isOptional) return true;
      this.enforceAdminBoundary(context);
      return canActivate;
    } catch (err) {
      if (isOptional) return true;
      throw err;
    }
  }

  private enforceAdminBoundary(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const rawUrl = String(request.originalUrl ?? request.url ?? '');
    const path = rawUrl.split('?')[0] ?? rawUrl;

    if (!/(^|\/)admin(\/|$)/.test(path)) {
      return;
    }

    const user = request.user;
    if (!user || user.aud !== 'admin' || user.userType === 'CUSTOMER') {
      throw new UnauthorizedException('Admin access token required');
    }
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const isOptional = request['isOptionalAuth'];

    if (isOptional) {
      // If optional and error/no-user, return null instead of throwing 401
      if (err || !user) {
        return null;
      }
      return user;
    }

    // Default behavior for non-optional routes
    return super.handleRequest(err, user, info, context);
  }
}
