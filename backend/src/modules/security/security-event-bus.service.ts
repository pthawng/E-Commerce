import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { Principal } from 'src/common/types/principal.types';

export enum SecurityEventType {
  OWNERSHIP_VIOLATION = 'OWNERSHIP_VIOLATION',
  TOKEN_REPLAY = 'TOKEN_REPLAY',
  HIGH_RISK_LOGIN = 'HIGH_RISK_LOGIN',
  ANOMALOUS_ACCESS = 'ANOMALOUS_ACCESS',
}

export interface SecurityEvent {
  type: SecurityEventType;
  principal: Principal;
  metadata?: Record<string, any>;
  timestamp: Date;
}

@Injectable()
export class SecurityEventBus {
  private readonly logger = new Logger(SecurityEventBus.name);
  private readonly eventSubject = new Subject<SecurityEvent>();

  /**
   * Observable stream of security events for listeners.
   */
  public events$ = this.eventSubject.asObservable();

  /**
   * Dispatches a new security event into the pipeline.
   */
  emit(type: SecurityEventType, principal: Principal, metadata?: Record<string, any>) {
    const event: SecurityEvent = {
      type,
      principal,
      metadata,
      timestamp: new Date(),
    };

    this.logger.debug(`[SecurityEvent] Dispatched: ${type} for Principal: ${principal.id}`);
    this.eventSubject.next(event);
  }
}
