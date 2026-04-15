import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark a route as "Optional Authentication".
 * - If a valid token is present: req.user is populated.
 * - If NO token or EXPIRED token is present: req.user is null, and the request is NOT blocked.
 * Used for "Hybrid" domains like Cart, Product details, or Guest Checkout.
 */
export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
