// mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import sgMail from '@sendgrid/mail';
import * as fs from 'fs/promises';
import * as handlebars from 'handlebars';
import * as path from 'path';
import { SmtpProvider } from './providers/smtp.provider';
import { EmailOutboxService } from './services/email-outbox.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly templatesDir = path.join(process.cwd(), 'src', 'modules', 'mail', 'templates');

  constructor(
    private configService: ConfigService,
    private outboxService: EmailOutboxService,
    private smtpProvider: SmtpProvider,
  ) {
    this.initializeProviders();
  }

  private initializeProviders() {
    const provider = this.configService.get<string>('MAIL_PROVIDER') || 'smtp';

    if (provider === 'sendgrid') {
      const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
      if (!apiKey) {
        this.logger.warn('SENDGRID_API_KEY is not defined');
      } else {
        sgMail.setApiKey(apiKey);
      }
    }
  }

  /**
   * Primary entry point for sending emails.
   * If USE_NEW_MAIL_FLOW is enabled, it uses the Outbox Pattern (Async).
   * Otherwise, it uses the legacy blocking flow (Sync).
   */
  async sendMail(
    options: {
      to: string;
      subject: string;
      template: string;
      context: any;
      eventType?: string;
      idempotencyKey?: string;
      templateVersion?: string;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const useNewFlow = this.configService.get<string>('USE_NEW_MAIL_FLOW') === 'true';

    if (useNewFlow) {
      this.logger.debug(`Using New Async Flow for email to ${options.to}`);
      return this.queueMail(options, tx);
    }

    return this.sendMailSync(options);
  }

  /**
   * Async Flow: Persists to Outbox.
   */
  private async queueMail(
    options: {
      to: string;
      subject: string;
      template: string;
      context: any;
      eventType?: string;
      idempotencyKey?: string;
      templateVersion?: string;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    try {
      await this.outboxService.create(
        {
          eventType: options.eventType || 'generic.notification',
          recipient: options.to,
          subject: options.subject,
          templateName: options.template,
          templateVersion: options.templateVersion || 'v1',
          context: options.context,
          idempotencyKey: options.idempotencyKey || `mail_${Date.now()}_${options.to}`,
        },
        tx,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to queue email to ${options.to}: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Legacy Sync Flow: Blocks request lifecycle.
   */
  private async sendMailSync(options: {
    to: string;
    subject: string;
    template: string;
    context: any;
  }): Promise<boolean> {
    try {
      const html = await this.compileTemplate(options.template, options.context);
      const provider = this.configService.get<string>('MAIL_PROVIDER') || 'smtp';

      if (provider === 'smtp') {
        return await this.sendViaSmtp(options, html);
      }

      if (provider === 'sendgrid') {
        return await this.sendViaSendGrid(options, html);
      }

      this.logger.warn(`Unknown mail provider: ${provider}`);
      return false;
    } catch (error) {
      this.logger.error('Error sending mail sync:', error);
      return false;
    }
  }

  private async compileTemplate(templateName: string, context: any): Promise<string> {
    const filePath = path.join(this.templatesDir, `${templateName}.hbs`);
    try {
      const templateSource = await fs.readFile(filePath, 'utf-8');
      return handlebars.compile(templateSource)(context);
    } catch (error) {
      this.logger.error(`Error reading template ${templateName}:`, error);
      throw error;
    }
  }

  private async sendViaSendGrid(
    options: { to: string; subject: string },
    html: string,
  ): Promise<boolean> {
    const fromEmail = this.configService.get<string>('MAIL_FROM');
    if (!fromEmail) throw new Error('MAIL_FROM is not defined');

    await sgMail.send({
      to: options.to,
      from: fromEmail,
      subject: options.subject,
      html,
    });
    this.logger.log(`SendGrid mail sent → ${options.to}`);
    return true;
  }

  private async sendViaSmtp(
    options: { to: string; subject: string },
    html: string,
  ): Promise<boolean> {
    const result = await this.smtpProvider.send({
      to: options.to,
      subject: options.subject,
      html,
    });

    if (!result.success) {
      throw new Error(result.error || 'SMTP send failed');
    }

    this.logger.log(`SMTP mail sent via Mailpit-compatible transport -> ${options.to}`);
    return true;
  }

  /**
   * Helper method to encapsulate the logic for sending admin order confirmations.
   * This removes the formatting burden from the OrderService.
   */
  async sendAdminOrderConfirmation(recipientEmail: string, order: any, dto: any) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const paymentUrl = `${frontendUrl}/checkout/pay?orderId=${order.id}`;
    const cancelUrl = `${frontendUrl}/checkout/cancel?orderId=${order.id}`;

    return this.sendMail({
      to: recipientEmail,
      subject: `[Ray Paradis] Xác nhận yêu cầu đặt đơn hàng #${order.code}`,
      template: 'admin-order-confirmation',
      eventType: 'order.admin_created',
      context: {
        companyName: 'Ray Paradis',
        orderCode: order.code,
        orderDate: new Intl.DateTimeFormat('vi-VN', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Asia/Ho_Chi_Minh',
        }).format(order.createdAt),
        customerName: dto.shippingName,
        shippingName: dto.shippingName,
        shippingPhone: dto.shippingPhone,
        shippingAddress: `${dto.shippingAddress.detail}, ${dto.shippingAddress.ward}, ${dto.shippingAddress.district}, ${dto.shippingAddress.city}`,
        items: order.items.map((item: any) => ({
          name: item.productName || 'Sản phẩm',
          quantity: item.quantity,
          price: Number(item.price).toLocaleString('vi-VN'),
        })),
        shippingFee: Number(order.shippingFee).toLocaleString('vi-VN'),
        totalAmount: Number(order.totalAmount).toLocaleString('vi-VN'),
        currency: 'VND',
        paymentUrl,
        cancelUrl,
        supportEmail: 'support@rayparadis.com',
        supportPhone: '1900xxxx',
      },
    });
  }
}
