import { BadRequestException, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { JwtAccessGuard } from '../../auth/guard/access-jwt.guard';
import { CurrentUser } from '@common/decorators/get-user.decorator';

@Controller('orders')
export class OrderRecoveryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @Post(':id/resend-confirmation')
  @UseGuards(JwtAccessGuard)
  async resendConfirmation(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { 
        items: true,
        user: { select: { email: true, fullName: true } }
      }
    });

    if (!order) throw new BadRequestException('Order not found or access denied');
    
    if (order.status === 'pending_payment') {
      throw new BadRequestException('Confirmation cannot be sent for unpaid orders');
    }

    const recipientEmail = order.user?.email || (order.shippingAddress as any)?.email;
    if (!recipientEmail) throw new BadRequestException('No email address associated with this order');

    // Trigger a NEW outbox record with a fresh idempotency key for this manual request
    await this.mailService.sendMail({
      to: recipientEmail,
      subject: `Order Confirmation - ${order.code} (Resent)`,
      template: 'order-confirmation',
      eventType: 'order.confirmed.manual',
      idempotencyKey: `order_confirm_resend_${order.id}_${Date.now()}`,
      context: {
        orderCode: order.code,
        customerName: order.user?.fullName || (order.shippingAddress as any)?.fullName || 'Valued Customer',
        items: order.items.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          price: Number(item.price).toLocaleString('vi-VN'),
          total: Number(item.totalLine).toLocaleString('vi-VN'),
        })),
        totalAmount: Number(order.totalAmount).toLocaleString('vi-VN'),
        shippingFee: Number(order.shippingFee).toLocaleString('vi-VN'),
        currency: 'VND',
        orderUrl: `/me/orders/${order.id}`
      }
    });

    return { message: 'Confirmation email has been queued for re-sending.' };
  }
}
