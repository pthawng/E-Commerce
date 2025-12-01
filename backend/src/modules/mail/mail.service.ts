// mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import * as fs from 'fs';
import { google } from 'googleapis';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private oAuth2Client: any;

  constructor(private configService: ConfigService) {
    const provider = this.configService.get<string>('MAIL_PROVIDER') || 'gmail';

    if (provider === 'sendgrid') {
      const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
      if (!apiKey) throw new Error('SENDGRID_API_KEY is not defined');
      sgMail.setApiKey(apiKey);
    }

    if (provider === 'gmail') {
      this.oAuth2Client = new google.auth.OAuth2(
        this.configService.get<string>('GMAIL_CLIENT_ID'),
        this.configService.get<string>('GMAIL_CLIENT_SECRET'),
        this.configService.get<string>('GMAIL_REDIRECT_URI') || 'http://localhost',
      );
      const refreshToken = this.configService.get<string>('GMAIL_REFRESH_TOKEN');
      if (!refreshToken) throw new Error('GMAIL_REFRESH_TOKEN is not defined');
      this.oAuth2Client.setCredentials({ refresh_token: refreshToken });
    }
  }

  private compileTemplate(templateName: string, context: any): string {
    const templatesDir = path.join(process.cwd(), 'src', 'modules', 'mail', 'templates');
    const filePath = path.join(templatesDir, `${templateName}.hbs`);
    const templateSource = fs.readFileSync(filePath, 'utf-8');
    return handlebars.compile(templateSource)(context);
  }

  async sendMail(options: { to: string; subject: string; template: string; context: any }) {
    const provider = this.configService.get<string>('MAIL_PROVIDER') || 'gmail';
    const html = this.compileTemplate(options.template, options.context);

    try {
      if (provider === 'sendgrid') {
        const fromEmail = this.configService.get<string>('MAIL_FROM');
        if (!fromEmail) throw new Error('MAIL_FROM is not defined');

        await sgMail.send({
          to: options.to,
          from: fromEmail,
          subject: options.subject,
          html,
        });
        this.logger.log(`SendGrid mail sent → ${options.to}`);
      }

      if (provider === 'gmail') {
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
      }

      return true;
    } catch (error) {
      this.logger.error('Error sending mail:', error);
      return false;
    }
  }
}
