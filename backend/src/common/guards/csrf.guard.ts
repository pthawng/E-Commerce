import { SecurityEventBus, SecurityEventType } from '@modules/security/security-event-bus.service';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { PrincipalType } from 'src/common/types/principal.types';

/**
 * CsrfGuard
 *
 * Implements standard Double-Submit Cookie pattern.
 * Compares the 'x-csrf-token' request header against the 'csrfToken' cookie.
 * Skips enforcement for @Public() routes (e.g. guest OTP, health checks).
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly securityEvents: SecurityEventBus,
  ) {}

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
      this.emitCsrfFailure(request, 'CSRF_TOKEN_MISSING');
      throw new ForbiddenException({
        code: 'CSRF_TOKEN_MISSING',
        message: 'Security validation failed (CSRF token missing).',
      });
    }

    if (csrfTokenHeader !== csrfTokenCookie) {
      this.emitCsrfFailure(request, 'CSRF_TOKEN_INVALID');
      throw new ForbiddenException({
        code: 'CSRF_TOKEN_INVALID',
        message: 'Security validation failed (CSRF token mismatch).',
      });
    }

    return true;
  }

  private emitCsrfFailure(request: Request, reason: string) {
    const requestWithUser = request as Request & {
      user?: { userId?: string; id?: string };
      correlationId?: string;
    };

    this.securityEvents.emit(
      SecurityEventType.CSRF_FAILURE,
      {
        id:
          requestWithUser.user?.userId ||
          requestWithUser.user?.id ||
          request.cookies?.['guestSessionId'] ||
          request.ip ||
          'anonymous',
        type: requestWithUser.user ? PrincipalType.USER : PrincipalType.GUEST,
        ip: request.ip,
      },
      {
        reason,
        method: request.method,
        path: request.originalUrl || request.url,
        correlationId: requestWithUser.correlationId,
      },
      'high',
    );
  }
}
