import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { Principal, PrincipalType } from '../../common/types/principal.types';
import { IOwnable } from '../../common/interfaces/ownable.interface';
import { SecurityEventBus, SecurityEventType } from './security-event-bus.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OwnershipRegistry {
    private readonly logger = new Logger(OwnershipRegistry.name);

    constructor(
        private readonly eventBus: SecurityEventBus,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

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
    createPrincipal(user?: any, sessionId?: string, orderAccessToken?: string): Principal {
        // 1. Order Access Token (Highest priority for guest success page)
        if (orderAccessToken) {
            try {
                const payload = this.jwtService.verify(orderAccessToken, {
                    secret: this.configService.get('JWT_CHECKOUT_SECRET'),
                });
                if (payload.sub === 'order_access' && payload.orderId) {
                    return {
                        id: payload.orderId,
                        type: PrincipalType.ORDER_ACCESS,
                    };
                }
            } catch (error) {
                this.logger.warn('Invalid or expired orderAccessToken provided');
            }
        }

        // 2. Authenticated User
        const id = user?.userId || user?.id;
        if (id) {
            return {
                id,
                type: PrincipalType.USER,
                roles: user.roles,
            };
        }

        // 3. Guest with Session
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
