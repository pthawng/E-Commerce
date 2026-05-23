import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('order.status.changed')
  async handleOrderStatusChanged(payload: any) {
    const { orderId, newStatus, oldStatus } = payload;

    this.logger.log(`Handling order status change notification: ${orderId} -> ${newStatus}`);

    // Notify about high-value transitions
    if (newStatus === 'CONFIRMED') {
      await this.notificationService.create({
        type: 'SUCCESS' as any,
        priority: 'MEDIUM' as any,
        title: 'New Confirmed Order',
        content: `Order #${orderId.substring(0, 8)} has been confirmed and is ready for production.`,
        metadata: {
          path: `/orders/${orderId}`,
          actionLabel: 'View Order',
        },
      });
    }

    if (newStatus === 'CANCELLED') {
      await this.notificationService.create({
        type: 'WARNING' as any,
        priority: 'HIGH' as any,
        title: 'Order Cancelled',
        content: `Order #${orderId.substring(0, 8)} has been cancelled.`,
        metadata: {
          path: `/orders/${orderId}`,
          actionLabel: 'Check Reason',
        },
      });
    }
  }

  @OnEvent('ledger.approval.required')
  async handleLedgerApproval(payload: any) {
    const { journalId, amount, currency, createdBy } = payload;

    await this.notificationService.create({
      type: 'ACTION_REQUIRED' as any,
      priority: 'CRITICAL' as any,
      title: 'Financial Approval Required',
      content: `A high-value posting of ${amount} ${currency} requires secondary approval.`,
      metadata: {
        path: '/ledger',
        actionLabel: 'Approve Now',
      },
    });
  }

  @OnEvent('security.alert')
  async handleSecurityAlert(payload: any) {
    const { message, severity, userId } = payload;

    await this.notificationService.create({
      userId,
      type: 'ERROR' as any,
      priority: severity === 'CRITICAL' ? 'CRITICAL' : ('HIGH' as any),
      title: 'Security Alert',
      content: message,
      metadata: {
        path: '/health',
      },
    });
  }
}
