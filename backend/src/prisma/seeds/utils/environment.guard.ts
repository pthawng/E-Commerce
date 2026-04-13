import { Logger } from '@nestjs/common';

/**
 * EnvironmentGuard
 * Helps prevent accidental demo seeding in production environments.
 */
export class EnvironmentGuard {
  private static readonly logger = new Logger('EnvironmentGuard');

  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production' || process.env.SEED_MODE === 'prod';
  }

  static isDevelopment(): boolean {
    return !this.isProduction();
  }

  /**
   * Ensures the operation is NOT running on production.
   * Throws if it is.
   */
  static denyProduction(taskName: string): void {
    if (this.isProduction()) {
      this.logger.error(`❌ CRITICAL SAFETY BREACH: Attempted to run "${taskName}" on PRODUCTION environment.`);
      throw new Error(`Safety Violation: "${taskName}" is strictly forbidden on production.`);
    }
  }

  /**
   * Warns if running on production but continues (use with caution).
   */
  static warnProduction(taskName: string): void {
    if (this.isProduction()) {
      this.logger.warn(`⚠️ CAUTION: Running system seed "${taskName}" on production environment.`);
    }
  }
}
