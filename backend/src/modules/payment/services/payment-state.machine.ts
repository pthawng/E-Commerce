import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PaymentProcessingStatus } from '@prisma/client';

/**
 * Payment State Machine
 * Enforces strict transitions for payment statuses to ensure data integrity
 */
@Injectable()
export class PaymentStateMachine {
    private readonly logger = new Logger(PaymentStateMachine.name);

    /**
     * Define valid next states for each current state
     */
    private readonly transitions: Record<PaymentProcessingStatus, PaymentProcessingStatus[]> = {
        [PaymentProcessingStatus.INIT]: [
            PaymentProcessingStatus.PROCESSING,
            PaymentProcessingStatus.SUCCESS,
            PaymentProcessingStatus.FAILED,
            PaymentProcessingStatus.EXPIRED,
        ],
        [PaymentProcessingStatus.PROCESSING]: [
            PaymentProcessingStatus.SUCCESS,
            PaymentProcessingStatus.FAILED,
            PaymentProcessingStatus.EXPIRED,
        ],
        [PaymentProcessingStatus.SUCCESS]: [
            PaymentProcessingStatus.REFUNDED
        ],
        [PaymentProcessingStatus.FAILED]: [
            PaymentProcessingStatus.PROCESSING, // Retry
            PaymentProcessingStatus.SUCCESS,    // Delayed success
            PaymentProcessingStatus.EXPIRED,
        ],
        [PaymentProcessingStatus.EXPIRED]: [], // Terminal state
        [PaymentProcessingStatus.REFUNDED]: [], // Terminal state
    };

    /**
     * Validate if a transition is allowed
     * @param currentState - Current status of the payment
     * @param nextState - Target status
     * @returns boolean
     */
    isValidTransition(currentState: PaymentProcessingStatus, nextState: PaymentProcessingStatus): boolean {
        // Same state is always valid (idempotency)
        if (currentState === nextState) return true;

        const allowedNextStates = this.transitions[currentState];
        return allowedNextStates.includes(nextState);
    }

    /**
     * Enforce transition and throw error if invalid
     * @param paymentId - Payment ID for logging
     * @param currentState - Current status
     * @param nextState - Target status
     */
    validateTransition(paymentId: string, currentState: PaymentProcessingStatus, nextState: PaymentProcessingStatus): void {
        if (!this.isValidTransition(currentState, nextState)) {
             this.logger.error(
                `Invalid payment transition for ${paymentId}: ${currentState} -> ${nextState}`
            );
            throw new BadRequestException(
                `Invalid status transition from ${currentState} to ${nextState}`
            );
        }
    }
}
