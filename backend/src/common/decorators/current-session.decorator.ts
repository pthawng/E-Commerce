import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Get Session ID from Headers or Cookies
 * Hybrid Support:
 * 1. x-client-session-id (Header)
 * 2. sessionId (Cookie)
 */
export const CurrentSession = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  // Check Header (legacy) then Cookie (new)
  return request.headers['x-client-session-id'] || request.cookies?.['sessionId'];
});
