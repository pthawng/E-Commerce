import { PaymentProcessingStatus, TransactionStatusEnum } from '@prisma/client';

/**
 * Payment Status Derivation Engine (Stripe-Grade)
 *
 * Payment is an aggregate — its status is DERIVED from its transactions.
 *
 * Rules:
 *   SUCCESS    = any(transaction.status === 'success')
 *   FAILED     = all(transaction.status === 'failed')
 *   PROCESSING = otherwise (has pending/processing transactions)
 *   INIT       = no transactions
 */
export function derivePaymentStatus(
  transactionStatuses: TransactionStatusEnum[],
): PaymentProcessingStatus {
  if (transactionStatuses.length === 0) {
    return PaymentProcessingStatus.INIT;
  }

  if (transactionStatuses.some((s) => s === TransactionStatusEnum.success)) {
    return PaymentProcessingStatus.SUCCESS;
  }

  if (transactionStatuses.every((s) => s === TransactionStatusEnum.failed)) {
    return PaymentProcessingStatus.FAILED;
  }

  return PaymentProcessingStatus.PROCESSING;
}
