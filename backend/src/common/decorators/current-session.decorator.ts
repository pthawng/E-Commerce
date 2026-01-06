import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Get Session ID from `x-client-session-id` header
 * Used for Guest Cart
 */
export const CurrentSession = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        // NodeJS headers are typically lowercase
        return request.headers['x-client-session-id'];
    },
);
