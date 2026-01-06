import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Guard
 * - Allows access to endpoint regardless of token presence.
 * - If VALID token exists: req.user is set.
 * - If NO token exists: req.user is null/undefined, request is NOT blocked (unlike standard JwtAuthGuard).
 * - Used for "Hybrid" endpoints like GET /cart (Guest vs User login).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt-access') {
    // Override handleRequest to not throw Error when no user
    handleRequest(err, user, info, context) {
        // If auth error or no user -> return null instead of throwing 401
        if (err || !user) {
            return null;
        }
        return user;
    }
}
