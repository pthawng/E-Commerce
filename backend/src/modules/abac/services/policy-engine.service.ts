/**
 * Policy Engine Service
 * Core service để evaluate policies với caching và performance optimization
 */

import { Injectable, Logger } from '@nestjs/common';
import type { BasePolicy } from '../base/base-policy';
import type { PolicyContext, PolicyEvaluationOptions, PolicyResult } from '../types/policy.types';

/**
 * Simple in-memory cache cho policy results
 * Production nên dùng Redis hoặc cache service
 */
interface PolicyCacheEntry {
  result: PolicyResult;
  expiresAt: number;
}

@Injectable()
export class PolicyEngineService {
  private readonly logger = new Logger(PolicyEngineService.name);
  private readonly cache = new Map<string, PolicyCacheEntry>();
  private readonly defaultCacheTtl = 60; // 60 seconds

  /**
   * Evaluate policy với caching
   */
  async evaluate<TResource = unknown>(
    policy: BasePolicy<TResource>,
    context: PolicyContext<TResource>,
    options: PolicyEvaluationOptions = {},
  ): Promise<PolicyResult> {
    // Generate cache key
    const cacheKey = this.generateCacheKey(policy, context, options);

    // Check cache (if not skipped)
    if (!options.skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        this.logger.debug(`Policy cache hit: ${cacheKey}`);
        return cached.result;
      }
    }

    // Evaluate policy
    this.logger.debug(
      `Evaluating policy: ${policy.constructor.name} for action: ${context.action}`,
    );
    const result = await policy.evaluate(context);

    // Cache result
    if (!options.skipCache) {
      const ttl = options.cacheTtl || this.defaultCacheTtl;
      this.cache.set(cacheKey, {
        result,
        expiresAt: Date.now() + ttl * 1000,
      });
    }

    return result;
  }

  /**
   * Clear cache for specific policy or all
   */
  clearCache(policyClass?: string): void {
    if (policyClass) {
      const keysToDelete: string[] = [];
      for (const key of this.cache.keys()) {
        if (key.startsWith(policyClass)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => this.cache.delete(key));
      this.logger.debug(`Cleared cache for policy: ${policyClass}`);
    } else {
      this.cache.clear();
      this.logger.debug('Cleared all policy cache');
    }
  }

  /**
   * Generate cache key từ policy, context và options
   */
  private generateCacheKey(
    policy: BasePolicy,
    context: PolicyContext,
    options: PolicyEvaluationOptions,
  ): string {
    const policyName = policy.constructor.name;
    const userId = context.user.userId;
    const action = context.action;
    const resourceId = context.resource
      ? String((context.resource as { id?: string }).id || 'unknown')
      : 'none';

    // Include additional context in cache key if provided
    const additionalContext = options.additionalContext
      ? JSON.stringify(options.additionalContext)
      : '';

    return `${policyName}:${userId}:${action}:${resourceId}:${additionalContext}`;
  }

  /**
   * Clean expired cache entries (should be called periodically)
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      this.logger.debug(`Cleaned ${keysToDelete.length} expired cache entries`);
    }
  }
}
