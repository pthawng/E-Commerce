// mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import * as fs from 'fs/promises';
import { google } from 'googleapis';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private oAuth2Client: any;
  private readonly templatesDir = path.join(process.cwd(), 'src', 'modules', 'mail', 'templates');

  constructor(private configService: ConfigService) {
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

  async sendMail(options: { to: string; subject: string; template: string; context: any }): Promise<boolean> {
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
      this.logger.error('Error sending mail:', error);
      return false;
    }
  }

  private async sendViaSendGrid(options: { to: string; subject: string }, html: string): Promise<boolean> {
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

  private async sendViaGmail(options: { to: string; subject: string }, html: string): Promise<boolean> {
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
