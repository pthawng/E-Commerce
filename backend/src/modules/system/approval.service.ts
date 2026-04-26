import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApprovalStatus, ApprovalType } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ApprovalService {
    private readonly logger = new Logger(ApprovalService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    /**
     * Creates a new approval request for a sensitive operation.
     * FAANG Grade: Captures intent, original state, and required authority.
     */
    async createRequest(params: {
        type: ApprovalType;
        resourceId: string;
        requestorId: string;
        reason: string;
        metadata?: any;
    }) {
        this.logger.log(`Creating approval request: ${params.type} for resource ${params.resourceId}`);

        const request = await this.prisma.approvalRequest.create({
            data: {
                type: params.type,
                resourceId: params.resourceId,
                requestorId: params.requestorId,
                reason: params.reason,
                metadata: params.metadata || {},
                status: ApprovalStatus.PENDING,
            },
        });

        // 🚀 FAANG Intelligence: Notify the nerve center
        this.eventEmitter.emit('ledger.approval.required', {
            requestId: request.id,
            type: params.type,
            reason: params.reason,
            amount: params.metadata?.amount,
            currency: params.metadata?.currency,
        });

        return request;
    }

    /**
     * Approves a request.
     * MUST be done by a different user than the requestor.
     */
    async approve(requestId: string, approverId: string, comment?: string) {
        return this.prisma.$transaction(async (tx) => {
            const request = await tx.approvalRequest.findUnique({
                where: { id: requestId },
            });

            if (!request) throw new NotFoundException('Approval request not found');
            if (request.status !== ApprovalStatus.PENDING) {
                throw new BadRequestException(`Request is already ${request.status}`);
            }

            // 4-Eyes Principle: Approver != Requestor
            if (request.requestorId === approverId) {
                throw new BadRequestException('4-Eyes Principle Violation: You cannot approve your own request.');
            }

            return tx.approvalRequest.update({
                where: { id: requestId },
                data: {
                    status: ApprovalStatus.APPROVED,
                    approverId,
                    approverComment: comment,
                    reviewedAt: new Date(),
                },
            });
        });
    }

    /**
     * Rejects a request.
     */
    async reject(requestId: string, approverId: string, comment: string) {
        if (!comment) throw new BadRequestException('Reason required for rejection.');

        return this.prisma.approvalRequest.update({
            where: { id: requestId },
            data: {
                status: ApprovalStatus.REJECTED,
                approverId,
                approverComment: comment,
                reviewedAt: new Date(),
            },
        });
    }

    /**
     * Verifies if a resource has an active approved request.
     */
    async verifyApproved(type: ApprovalType, resourceId: string) {
        const request = await this.prisma.approvalRequest.findFirst({
            where: {
                type,
                resourceId,
                status: ApprovalStatus.APPROVED,
            },
            orderBy: { reviewedAt: 'desc' },
        });

        if (!request) {
            throw new BadRequestException(`Operation requires an approved request (Type: ${type}).`);
        }

        return request;
    }
}
