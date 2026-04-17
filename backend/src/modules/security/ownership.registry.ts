import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { Principal, PrincipalType } from '../../common/types/principal.types';
import { IOwnable } from '../../common/interfaces/ownable.interface';
import { SecurityEventBus, SecurityEventType } from './security-event-bus.service';

@Injectable()
export class OwnershipRegistry {
    private readonly logger = new Logger(OwnershipRegistry.name);

    constructor(private readonly eventBus: SecurityEventBus) { }

    /**
     * Verifies if the principal has authority over the ownable resource.
     */
    verify(principal: Principal, resource: IOwnable, context?: string): void {
        const owners = resource.getOwners();

        // Principal match: iterate owners and find a match for current principal
        const isOwner = owners.some(owner =>
            owner.id === principal.id && owner.type === principal.type
        );

        if (!isOwner) {
            this.eventBus.emit(SecurityEventType.OWNERSHIP_VIOLATION, principal, { context, owners });
            this.logger.warn(
                `OWNERSHIP VIOLATION: Principal ${principal.id} (${principal.type}) attempted to access resource owned by [${owners.map(o => o.id).join(', ')}]. Context: ${context}`
            );
            throw new ForbiddenException('Access Denied: Resource ownership mismatch.');
        }
    }

    /**
     * Unifies identity from request into a Principal.
     */
    createPrincipal(user?: any, sessionId?: string): Principal {
        if (user?.id) {
            return {
                id: user.id,
                type: PrincipalType.USER,
                roles: user.roles,
            };
        }

        if (sessionId) {
            return {
                id: sessionId,
                type: PrincipalType.GUEST,
            };
        }

        return {
            id: 'anonymous',
            type: PrincipalType.GUEST,
        };
    }
}
