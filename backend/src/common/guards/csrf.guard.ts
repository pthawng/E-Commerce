import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * CsrfGuard
 * 
 * Implements standard Double-Submit Cookie pattern.
 * Compares the 'x-csrf-token' request header against the 'csrfToken' cookie.
 * This is effectively stateless and highly scalable.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();

        // Skip for safe methods (GET, HEAD, OPTIONS)
        const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
        if (safeMethods.includes(request.method)) {
            return true;
        }

        const csrfTokenHeader = request.headers['x-csrf-token'] as string;
        const csrfTokenCookie = request.cookies['csrfToken'];

        if (!csrfTokenHeader || !csrfTokenCookie) {
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
