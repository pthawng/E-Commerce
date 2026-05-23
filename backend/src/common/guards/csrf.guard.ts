import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';

/**
 * CsrfGuard
 *
 * Implements standard Double-Submit Cookie pattern.
 * Compares the 'x-csrf-token' request header against the 'csrfToken' cookie.
 * Skips enforcement for @Public() routes (e.g. guest OTP, health checks).
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Skip for safe methods (GET, HEAD, OPTIONS)
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(request.method)) {
      return true;
    }

    // Skip for @Public() routes — these are unauthenticated flows (e.g. guest OTP)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const csrfTokenHeader = request.headers['x-csrf-token'];
    const csrfTokenCookie = request.cookies ? request.cookies['csrfToken'] : undefined;

    if (!csrfTokenHeader || typeof csrfTokenHeader !== 'string' || !csrfTokenCookie) {
      throw new ForbiddenException({
        code: 'CSRF_TOKEN_MISSING',
        message: 'Security validation failed (CSRF token missing).',
      });
    }

    if (csrfTokenHeader !== csrfTokenCookie) {
      throw new ForbiddenException({
        code: 'CSRF_TOKEN_INVALID',
        message: 'Security validation failed (CSRF token mismatch).',
      });
    }

    return true;
  }
}
