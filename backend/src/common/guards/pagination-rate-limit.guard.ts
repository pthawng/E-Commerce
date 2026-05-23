import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class PaginationRateLimitGuard extends ThrottlerGuard {
  protected readonly logger = new Logger(PaginationRateLimitGuard.name);

  /**
   * P1-3: Multi-dimensional Rate Limiting Logic (v6 Compatible).
   */
  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, limit, ttl } = requestProps;
    const request = context.switchToHttp().getRequest();

    if (!request) return true;

    const user = request.user;
    const query = request.query || {};

    let adjustedLimit = limit;
    let adjustedTtl = ttl;

    // [L9] Forensic Admin Detection
    const isAdmin =
      user?.aud === 'admin' ||
      user?.roles?.includes('admin') ||
      user?.roles?.includes('superadmin');

    const page = Number(query.page);

    // Only penalize non-admin users for deep offset scans
    if (page > 50 && !isAdmin) {
      adjustedLimit = Math.max(1, Math.floor(limit / 4));
      adjustedTtl = ttl * 2;
    }

    return await super.handleRequest({
      ...requestProps,
      limit: adjustedLimit,
      ttl: adjustedTtl,
    });
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.userId || req.user?.id || req.ip || 'anon';
  }
}
