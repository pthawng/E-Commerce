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

        // 2. If missing, generate new one
        if (!sessionId) {
            sessionId = randomUUID();

            // Set HttpOnly cookie for persistence
            // Expires in 30 days (matching Cart TTL)
            res.cookie('sessionId', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });

            // Also inject into headers so downstream decorators can pick it up immediately
            req.headers['x-client-session-id'] = sessionId;
        }

        next();
    }
}
