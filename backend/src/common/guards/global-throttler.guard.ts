import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class GlobalThrottlerGuard extends ThrottlerGuard {
    protected readonly logger = new Logger(GlobalThrottlerGuard.name);

    /**
     * Explicitly exempt infrastructure health probes and metric scrapers 
     * from all rate limiting to ensure 100% availability.
     */
    protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
        const { context } = requestProps;
        const request = context.switchToHttp().getRequest();

        if (!request) return true;

        const path = request.url || '';

        // P0: Exempt infrastructure paths (Render, Prometheus, K8s)
        const exemptPaths = [
            '/',
            '/health',
            '/api/health',
            '/metrics',
            '/api/metrics',
            '/api',
        ];

        if (exemptPaths.includes(path) || path.startsWith('/health/') || path.startsWith('/api/health/')) {
            return true;
        }

        // P1: Check for Render specific headers if path check is insufficient
        const userAgent = request.headers['user-agent'] || '';
        if (userAgent.includes('Render/')) {
            return true;
        }

        try {
            return await super.handleRequest(requestProps);
        } catch (e) {
            this.logger.error('GlobalThrottler error - failing open', e);
            return true;
        }
    }
}
