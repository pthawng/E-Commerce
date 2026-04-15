import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { PaymentMethodEnum } from '@prisma/client';
import { Job } from 'bull';
import { PaymentService } from '../payment.service';

/**
 * Payment Processor
 * Offloads payment callback processing to a background queue
 */
@Processor('payment_status')
export class PaymentProcessor {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Process('process_callback')
  async handlePaymentCallback(
    job: Job<{
      paymentMethod: PaymentMethodEnum;
      callbackData: Record<string, any>;
      headers?: Record<string, any>;
    }>,
  ) {
    const { paymentMethod, callbackData, headers } = job.data;

    this.logger.log(`Processing background job for ${paymentMethod} callback`);

    try {
      // 1. Get the provider
      const provider = this.paymentService.getProvider(paymentMethod);

      // 2. Performance signature verification if supported and headers are present
      if (provider.verifyWebhookSignature && headers) {
        this.logger.log(`Verifying webhook signature for ${paymentMethod}`);
        const isValid = await provider.verifyWebhookSignature(headers, callbackData);

        if (!isValid) {
          this.logger.error(
            `Invalid webhook signature detected for ${paymentMethod}! Potential attack.`,
          );
          return; // Stop processing
        }
        this.logger.log(`Signature verified for ${paymentMethod}`);
      }

      // 3. Process the callback (Update DB, State Machine, Inventory)
      await this.paymentService.processCallback(paymentMethod, callbackData);
      this.logger.log(`Successfully processed background job for ${paymentMethod}`);
    } catch (error) {
      this.logger.error(
        `Failed to process background job for ${paymentMethod}: ${error.message}`,
        error.stack,
      );
      // Throw error to trigger Bull retry logic (if configured)
      throw error;
    }
  }
}
