import { randomUUID } from 'crypto';
import { Request, Response } from 'express';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const setAuthCookies = (req: Request, res: Response, tokens: AuthTokens) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Rotating CSRF Token: Generate new one on each auth event
  const csrfToken = randomUUID();

  const cookieOptions = {
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
  };

  // 1. Access Token (HttpOnly)
  res.cookie('accessToken', tokens.accessToken, {
    ...cookieOptions,
    httpOnly: true,
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  // 2. Refresh Token (HttpOnly)
  res.cookie('refreshToken', tokens.refreshToken, {
    ...cookieOptions,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // 3. CSRF Token (Double Submit Pattern)
  res.cookie('csrfToken', csrfToken, {
    ...cookieOptions,
    httpOnly: false, // Must be accessible to frontend JS to send as header
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // 4. UA Binding for soft validation
  const ua = req.headers['user-agent'] || 'unknown';
  res.cookie('ua_binding', ua, {
    ...cookieOptions,
    httpOnly: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return csrfToken;
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.clearCookie('csrfToken');
};
