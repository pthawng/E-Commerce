import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class PaginationRateLimitGuard extends ThrottlerGuard {
    protected readonly logger = new Logger(PaginationRateLimitGuard.name);

    /**
     * P1-3: Multi-dimensional Rate Limiting Logic (v6 Compatible).
     */
    protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
        const { context, limit, ttl, throttler } = requestProps;
        const request = context.switchToHttp().getRequest();

        // Safety check for request object
        if (!request) return true;

        const user = request.user;
        const query = request.query || {};

        let adjustedLimit = limit;
        let adjustedTtl = ttl;

        // 1. Penalize large page requests (Offset O(N) protection)
        const page = Number(query.page);
        if (page > 50) {
            adjustedLimit = Math.max(1, Math.floor(limit / 4));
            adjustedTtl = ttl * 2;
        }

        // 2. Penalize large limit requests
        const requestedLimit = Number(query.limit);
        if (requestedLimit > 50) {
            adjustedLimit = Math.max(1, Math.floor(limit / 2));
        }

        // 3. Identification (Tracker)
        const tracker = user?.id || request.ip || 'anon';

        try {
            return await super.handleRequest({
                ...requestProps,
                limit: adjustedLimit,
                ttl: adjustedTtl,
                throttler: {
                    ...throttler,
                    name: `pagination_${tracker.replace(/[^a-zA-Z0-9]/g, '_')}`,
                },
            });
        } catch (e) {
            this.logger.error('Throttler handleRequest error', e);
            // Fail open in case of throttler internal error (Priority: Availabilityb)
            return true;
        } 
    }
}
