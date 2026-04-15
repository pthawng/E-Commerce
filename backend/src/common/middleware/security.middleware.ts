import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { NextFunction, Request, Response } from 'express';

/**
 * SecurityMiddleware
 *
 * Implements strict Content-Security-Policy (CSP) headers with nonces.
 * Protects against XSS, clickjacking, and unauthorized resource loading.
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const isProduction = process.env.NODE_ENV === 'production';
    const nonce = randomBytes(16).toString('base64');

    // Attach nonce to request for views if needed
    (req as any).nonce = nonce;

    // Strict CSP Header
    // Note: In development, we relax some rules ('unsafe-inline' for HMR)
    const scriptSrc = isProduction
      ? `'self' 'nonce-${nonce}'`
      : `'self' 'unsafe-inline' 'unsafe-eval'`;

    const cspHeader = [
      `default-src 'self'`,
      `script-src ${scriptSrc} https://cdn.jsdelivr.net https://pay.vnpay.vn https://www.paypal.com`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `img-src 'self' data: https:`,
      `font-src 'self' https://fonts.gstatic.com`,
      `connect-src 'self' https://sandbox.vnpayment.vn https://api-m.sandbox.paypal.com`,
      `frame-src 'self' https://pay.vnpay.vn https://www.paypal.com`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
    ].join('; ');

    res.setHeader('Content-Security-Policy', cspHeader);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    next();
  }
}
