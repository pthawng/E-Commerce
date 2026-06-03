import { SecurityEventBus, SecurityEventType } from '@modules/security/security-event-bus.service';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrincipalType } from 'src/common/types/principal.types';

/**
 * SessionBindingGuard
 *
 * Soft Security: Ensures the User-Agent that initiated the session (or refresh)
 * remains consistent. This prevents simple token hijacking across different devices.
 */
@Injectable()
export class SessionBindingGuard implements CanActivate {
  private readonly logger = new Logger(SessionBindingGuard.name);

  constructor(private readonly securityEvents: SecurityEventBus) {}

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

      this.securityEvents.emit(
        SecurityEventType.SUSPICIOUS_SESSION,
        {
          id: user.userId || user.id || 'unknown',
          type: PrincipalType.USER,
          ip: request.ip,
        },
        {
          reason: 'SESSION_UA_MISMATCH',
          expectedUserAgent: sessionUA,
          receivedUserAgent: currentUA,
          path: request.originalUrl || request.url,
        },
        'high',
      );

      // Allow softer checks in dev/testing; enforce in production.
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Session binding mismatch. Please login again.');
      }
    }

    return true;
  }
}
