import { RequestContextService } from '@modules/observability/request-context.service';
import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { Principal } from 'src/common/types/principal.types';

export enum SecurityEventType {
  OWNERSHIP_VIOLATION = 'OWNERSHIP_VIOLATION',
  TOKEN_REPLAY = 'TOKEN_REPLAY',
  HIGH_RISK_LOGIN = 'HIGH_RISK_LOGIN',
  ANOMALOUS_ACCESS = 'ANOMALOUS_ACCESS',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  MFA_SUCCESS = 'MFA_SUCCESS',
  MFA_FAILURE = 'MFA_FAILURE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  CSRF_FAILURE = 'CSRF_FAILURE',
  SUSPICIOUS_SESSION = 'SUSPICIOUS_SESSION',
}

export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEvent {
  type: SecurityEventType;
  principal: Principal;
  metadata?: Record<string, unknown>;
  severity: SecurityEventSeverity;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

@Injectable()
export class SecurityEventBus {
  private readonly logger = new Logger(SecurityEventBus.name);
  private readonly eventSubject = new Subject<SecurityEvent>();

  constructor(private readonly requestContext: RequestContextService) {}

  /**
   * Observable stream of security events for listeners.
   */
  public events$ = this.eventSubject.asObservable();

  /**
   * Dispatches a new security event into the pipeline.
   */
  emit(
    type: SecurityEventType,
    principal: Principal,
    metadata?: Record<string, unknown>,
    severity: SecurityEventSeverity = this.defaultSeverity(type),
  ) {
    const context = this.requestContext.get();
    const event: SecurityEvent = {
      type,
      principal,
      metadata,
      severity,
      correlationId: context?.correlationId,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      timestamp: new Date(),
    };

    this.logger.debug(
      `[SecurityEvent] Dispatched: ${type} for Principal: ${principal.id} correlationId=${
        event.correlationId || 'none'
      }`,
    );
    this.eventSubject.next(event);
  }

  private defaultSeverity(type: SecurityEventType): SecurityEventSeverity {
    switch (type) {
      case SecurityEventType.TOKEN_REPLAY:
        return 'critical';
      case SecurityEventType.OWNERSHIP_VIOLATION:
      case SecurityEventType.CSRF_FAILURE:
      case SecurityEventType.SUSPICIOUS_SESSION:
      case SecurityEventType.PERMISSION_DENIED:
        return 'high';
      case SecurityEventType.LOGIN_FAILURE:
      case SecurityEventType.MFA_FAILURE:
      case SecurityEventType.HIGH_RISK_LOGIN:
      case SecurityEventType.ANOMALOUS_ACCESS:
        return 'medium';
      default:
        return 'low';
    }
  }
}
