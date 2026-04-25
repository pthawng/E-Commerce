import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

/**
 * SessionMiddleware
 *
 * Ensures every visitor has a sessionId.
 * If not present in headers or cookies, generates a new UUID and sets it as an HttpOnly cookie.
 */
@Injectable()
export class SessionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 1. Try to get existing session ID
    let sessionId = req.headers['x-client-session-id'] || req.cookies?.['sessionId'];

    // 2. If missing, generate new ones
    if (!sessionId || !req.cookies?.['csrfToken']) {
      sessionId = sessionId || randomUUID();
      const csrfToken = randomUUID();

      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        secure: isProduction,
        sameSite: 'lax' as const,
        path: '/',
      };

      // Session ID (HttpOnly)
      res.cookie('sessionId', sessionId, {
        ...cookieOptions,
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      // CSRF Token (Accessible to JS for Header submission)
      res.cookie('csrfToken', csrfToken, {
        ...cookieOptions,
        httpOnly: false,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      // Also inject into headers so downstream decorators/guards can pick them up
      req.headers['x-client-session-id'] = sessionId;
    }

    // Always expose the current CSRF token in the response header for the client to capture
    const currentCsrfToken = req.cookies?.['csrfToken'];
    if (currentCsrfToken) {
      res.setHeader('x-csrf-token', currentCsrfToken);
    }

    next();
  }
}
