import { SetMetadata } from '@nestjs/common';

export const SKIP_JWT_AUTH_KEY = 'skipJwtAuth';

/**
 * Skips only the global storefront JWT guard.
 *
 * Use this for endpoints protected by another guard, such as the back-office
 * cookie session guard. Unlike @Public(), CSRF protection and route-specific
 * guards still apply.
 */
export const SkipJwtAuth = () => SetMetadata(SKIP_JWT_AUTH_KEY, true);
