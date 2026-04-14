export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'sendgrid' | 'ses';
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  metadata?: Record<string, string>;
}

export abstract class EmailProvider {
  abstract send(options: EmailOptions): Promise<EmailResponse>;
  abstract getName(): 'sendgrid' | 'ses';
}
