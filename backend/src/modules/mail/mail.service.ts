// mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import sgMail from '@sendgrid/mail';
import * as fs from 'fs/promises';
import { google } from 'googleapis';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import { EmailOutboxService } from './services/email-outbox.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private oAuth2Client: any;
  private readonly templatesDir = path.join(process.cwd(), 'src', 'modules', 'mail', 'templates');

  constructor(
    private configService: ConfigService,
    private outboxService: EmailOutboxService,
  ) {
    this.initializeProviders();
  }

  private initializeProviders() {
    const provider = this.configService.get<string>('MAIL_PROVIDER') || 'gmail';

    if (provider === 'sendgrid') {
      const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
      if (!apiKey) {
        this.logger.warn('SENDGRID_API_KEY is not defined');
      } else {
        sgMail.setApiKey(apiKey);
      }
    }

    if (provider === 'gmail') {
      this.initializeGmail();
    }
  }

  private initializeGmail() {
    const clientId = this.configService.get<string>('GMAIL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GMAIL_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GMAIL_REDIRECT_URI') || 'http://localhost';
    const refreshToken = this.configService.get<string>('GMAIL_REFRESH_TOKEN');

    if (!clientId || !clientSecret || !refreshToken) {
      this.logger.warn('Gmail credentials are missing. Mail service may not work.');
      return;
    }

    this.oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    this.oAuth2Client.setCredentials({ refresh_token: refreshToken });
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
      const provider = this.configService.get<string>('MAIL_PROVIDER') || 'gmail';

      if (provider === 'sendgrid') {
        return await this.sendViaSendGrid(options, html);
      }

      if (provider === 'gmail') {
        return await this.sendViaGmail(options, html);
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

  private async sendViaGmail(
    options: { to: string; subject: string },
    html: string,
  ): Promise<boolean> {
    if (!this.oAuth2Client) {
      throw new Error('Gmail client not initialized properly');
    }

    const accessTokenObj = await this.oAuth2Client.getAccessToken();
    const accessToken = accessTokenObj?.token;
    if (!accessToken) throw new Error('Failed to get access token');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: this.configService.get<string>('GMAIL_USER'),
        clientId: this.configService.get<string>('GMAIL_CLIENT_ID'),
        clientSecret: this.configService.get<string>('GMAIL_CLIENT_SECRET'),
        refreshToken: this.configService.get<string>('GMAIL_REFRESH_TOKEN'),
        accessToken,
      },
    });

    await transporter.sendMail({
      from: this.configService.get<string>('GMAIL_USER'),
      to: options.to,
      subject: options.subject,
      html,
    });
    this.logger.log(`Gmail OAuth2 mail sent → ${options.to}`);
    return true;
  }
}
