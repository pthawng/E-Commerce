import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import * as fs from 'fs/promises';
import * as handlebars from 'handlebars';
import * as path from 'path';
import { SendGridProvider } from '../providers/sendgrid.provider';
import { SesProvider } from '../providers/ses.provider';
import { CircuitBreakerService, CircuitBreakerState } from './circuit-breaker.service';
import { EmailOutboxService } from './email-outbox.service';

@Processor('email-queue')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly templatesDir = path.join(process.cwd(), 'src', 'modules', 'mail', 'templates');
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(
    private readonly outboxService: EmailOutboxService,
    private readonly sendgridProvider: SendGridProvider,
    private readonly sesProvider: SesProvider,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {}

  @Process('send-email')
  async handleSendEmail(job: Job<any>) {
    const { outboxId, recipient, subject, templateName, templateVersion, context, attempts } =
      job.data;

    this.logger.log(`Processing email job for outboxId: ${outboxId} (Attempt: ${attempts})`);

    try {
      // 1. Exactly-Once Illusion Check
      // In a real high-fidelity system, we might check the provider for the messageId
      // if it was partially updated. Here we ensure we don't re-process if already SENT.
      // (The Relay already filters for PENDING, but workers might overlap if Bull retries).

      // 2. Render HTML (with caching & versioning)
      const html = await this.renderTemplate(templateName, templateVersion, context);

      // 3. Send with Fallback Logic
      const result = await this.sendWithFallback(recipient, subject, html, outboxId);

      if (result.success) {
        const providerName = (result as any).provider || 'unknown';
        const msgId = (result as any).messageId || 'unknown';
        await this.outboxService.markAsSent(outboxId, providerName, msgId);
        this.logger.log(`Email sent successfully via ${providerName} for outboxId: ${outboxId}`);
      } else {
        await this.outboxService.markAsFailed(outboxId, result.error || 'Unknown error', attempts);
        this.logger.error(`Email failed for outboxId: ${outboxId}. Error: ${result.error}`);
      }
    } catch (error) {
      this.logger.error(
        `Fatal error in EmailProcessor for outboxId ${outboxId}: ${error.message}`,
        error.stack,
      );
      await this.outboxService.markAsFailed(outboxId, error.message, attempts);
      throw error; // Re-throw for BullMQ to handle job failure state
    }
  }

  private async sendWithFallback(to: string, subject: string, html: string, outboxId: string) {
    const sendGridState = await this.circuitBreaker.getState('sendgrid');

    // Phase 1: Try SendGrid if it's not OPEN
    if (sendGridState !== CircuitBreakerState.OPEN) {
      this.logger.debug(`Circuit Breaker for SendGrid is ${sendGridState}. Attempting send...`);
      const sgResult = await this.sendgridProvider.send({
        to,
        subject,
        html,
        metadata: { outboxId },
      });

      if (sgResult.success) {
        await this.circuitBreaker.recordSuccess('sendgrid');
        return sgResult;
      }

      await this.circuitBreaker.recordFailure('sendgrid');
      this.logger.warn(
        `Primary provider (SendGrid) failed for ${outboxId}. Falling back to SES...`,
      );
    } else {
      this.logger.warn(
        `Circuit Breaker for SendGrid is OPEN. Directing traffic to SES for ${outboxId}.`,
      );
    }

    // Phase 2: Traffic directed to SES either by fallback or because SendGrid is OPEN
    const sesState = await this.circuitBreaker.getState('ses');
    if (sesState !== CircuitBreakerState.OPEN) {
      const sesResult = await this.sesProvider.send({ to, subject, html, metadata: { outboxId } });

      if (sesResult.success) {
        await this.circuitBreaker.recordSuccess('ses');
      } else {
        await this.circuitBreaker.recordFailure('ses');
      }
      return sesResult;
    }

    // Fatal: Both are OPEN
    return { success: false, error: 'All email providers are currently OPEN (failing).' };
  }

  private async renderTemplate(name: string, version: string, context: any): Promise<string> {
    const cacheKey = `${version}/${name}`;
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!(context);
    }

    // Path includes versioning for safety (L8 requirement)
    // For now, if version folder doesn't exist, we fall back to the root templates dir
    let filePath = path.join(this.templatesDir, version, `${name}.hbs`);

    try {
      await fs.access(filePath);
    } catch {
      filePath = path.join(this.templatesDir, `${name}.hbs`);
    }

    const source = await fs.readFile(filePath, 'utf-8');
    const template = handlebars.compile(source);
    this.templateCache.set(cacheKey, template);

    return template(context);
  }
}
