import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * SessionBindingGuard
 *
 * Soft Security: Ensures the User-Agent that initiated the session (or refresh)
 * remains consistent. This prevents simple token hijacking across different devices.
 */
@Injectable()
export class SessionBindingGuard implements CanActivate {
  private readonly logger = new Logger(SessionBindingGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip if not authenticated or no session
    if (!user) return true;

    const currentUA = request.headers['user-agent'];
    const sessionUA = request.cookies?.['ua_binding'];

    if (!sessionUA) {
      // If no binding exists, we might be in the middle of a migration or first login
      return true;
    }

    if (currentUA !== sessionUA) {
      this.logger.warn(
        `Session hijack attempt detected! UA mismatch. User: ${user.userId || 'Guest'}`,
      );
      this.logger.warn(`Expected: ${sessionUA}`);
      this.logger.warn(`Received: ${currentUA}`);

      // L8 Loosen Security for Dev/Testing: Only throw if in production
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Session binding mismatch. Please login again.');
      }
    }

    return true;
  }
}
