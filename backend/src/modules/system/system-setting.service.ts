import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma/prisma.service';
import { ZodError } from 'zod';
import { RequestContextService } from '../observability/request-context.service';
import {
  getDefaultSettings,
  getDefaultSettingValue,
  isSettingKey,
  SETTINGS_REGISTRY,
  validateSettingValue,
  type SettingKey,
  type SettingValue,
} from './settings.registry';

const SETTINGS_ALL_CACHE_KEY = 'system-settings:all';
const SETTINGS_CACHE_TTL_MS = 60_000;

type SettingsMap = Record<string, unknown>;
type SettingRegistryItem = {
  key: SettingKey;
  group: string;
  description: string;
  defaultValue: SettingValue;
  valueType: 'boolean' | 'number' | 'string';
};

@Injectable()
export class SystemSettingService {
  private readonly logger = new Logger(SystemSettingService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly requestContext: RequestContextService,
  ) {}

  /**
   * Returns current settings as a key-value map for backward compatibility.
   * Registered settings are validated and fall back to typed defaults if DB data is invalid.
   */
  async getAllSettings(): Promise<SettingsMap> {
    const cached = await this.cacheManager.get<SettingsMap>(SETTINGS_ALL_CACHE_KEY);
    if (cached) return cached;

    const settings = await this.prisma.systemSetting.findMany();
    const result: SettingsMap = { ...getDefaultSettings() };

    for (const setting of settings) {
      if (!isSettingKey(setting.key)) {
        result[setting.key] = setting.value;
        continue;
      }

      result[setting.key] = this.validateOrDefault(setting.key, setting.value);
    }

    await this.cacheManager.set(SETTINGS_ALL_CACHE_KEY, result, SETTINGS_CACHE_TTL_MS);
    return result;
  }

  getRegistry(): SettingRegistryItem[] {
    return Object.entries(SETTINGS_REGISTRY).map(([key, definition]) => ({
      key: key as SettingKey,
      group: definition.group,
      description: definition.description,
      defaultValue: definition.defaultValue,
      valueType: typeof definition.defaultValue as SettingRegistryItem['valueType'],
    }));
  }

  async getValue(key: SettingKey): Promise<SettingValue> {
    const cacheKey = this.cacheKey(key);
    const cached = await this.cacheManager.get<SettingValue>(cacheKey);
    if (cached !== undefined && cached !== null) return cached;

    const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
    const value = setting
      ? this.validateOrDefault(key, setting.value)
      : getDefaultSettingValue(key);

    await this.cacheManager.set(cacheKey, value, SETTINGS_CACHE_TTL_MS);
    return value;
  }

  async getNumber(key: SettingKey): Promise<number> {
    const value = await this.getValue(key);
    if (typeof value !== 'number') {
      throw new Error(`Setting ${key} is not a number`);
    }
    return value;
  }

  async getBoolean(key: SettingKey): Promise<boolean> {
    const value = await this.getValue(key);
    if (typeof value !== 'boolean') {
      throw new Error(`Setting ${key} is not a boolean`);
    }
    return value;
  }

  async getString(key: SettingKey): Promise<string> {
    const value = await this.getValue(key);
    if (typeof value !== 'string') {
      throw new Error(`Setting ${key} is not a string`);
    }
    return value;
  }

  /**
   * Updates registered settings only. Each setting update is versioned and audited.
   */
  async updateSettings(settings: Record<string, unknown>, userId?: string, reason?: string) {
    const entries = Object.entries(settings);
    if (entries.length === 0) {
      throw new BadRequestException('No settings provided');
    }

    const validatedEntries = entries.map(([key, value]) => {
      if (!isSettingKey(key)) {
        throw new BadRequestException(`Unknown system setting: ${key}`);
      }

      return {
        key,
        value: this.validateForWrite(key, value),
      };
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      const context = this.requestContext.get();
      const results: Array<{ key: SettingKey; version: number; value: SettingValue }> = [];

      for (const entry of validatedEntries) {
        const current = await tx.systemSetting.findUnique({ where: { key: entry.key } });
        const nextVersion = (current?.version ?? 0) + 1;

        const saved = await tx.systemSetting.upsert({
          where: { key: entry.key },
          update: {
            value: entry.value,
            version: nextVersion,
            description: SETTINGS_REGISTRY[entry.key].description,
            updatedBy: userId,
          },
          create: {
            key: entry.key,
            value: entry.value,
            version: nextVersion,
            description: SETTINGS_REGISTRY[entry.key].description,
            updatedBy: userId,
          },
        });

        await tx.auditLog.create({
          data: {
            userId,
            action: 'SYSTEM_SETTING_UPDATE',
            entityTable: 'system_settings',
            entityId: entry.key,
            actorType: 'staff',
            resourceType: 'system_settings',
            resourceId: entry.key,
            reason,
            ipAddress: context?.ipAddress,
            userAgent: context?.userAgent,
            correlationId: context?.correlationId,
            requestId: context?.requestId,
            before: current
              ? ({
                  value: current.value,
                  version: current.version,
                } as Prisma.InputJsonObject)
              : undefined,
            after: {
              value: saved.value,
              version: saved.version,
            } as Prisma.InputJsonObject,
            metadata: {
              reason: reason ?? null,
              description: SETTINGS_REGISTRY[entry.key].description,
            } as Prisma.InputJsonObject,
          },
        });

        results.push({ key: entry.key, version: saved.version, value: entry.value });
      }

      return results;
    });

    await this.invalidateCache(updated.map((setting) => setting.key));

    this.logger.log(
      `System settings updated by user ${userId || 'system'}: ${updated
        .map((setting) => `${setting.key}@v${setting.version}`)
        .join(', ')}`,
    );

    return {
      success: true,
      updated,
    };
  }

  private cacheKey(key: SettingKey): string {
    return `system-setting:${key}`;
  }

  private async invalidateCache(keys: SettingKey[]) {
    const dependentCacheKeys = keys.includes('inventory.lowStockThreshold')
      ? ['dashboard_stats']
      : [];

    await Promise.allSettled([
      this.cacheManager.del(SETTINGS_ALL_CACHE_KEY),
      ...keys.map((key) => this.cacheManager.del(this.cacheKey(key))),
      ...dependentCacheKeys.map((key) => this.cacheManager.del(key)),
    ]);
  }

  private validateOrDefault(key: SettingKey, value: unknown): SettingValue {
    try {
      return validateSettingValue(key, value);
    } catch (error) {
      this.logger.warn(
        `Invalid stored value for ${key}; using default. ${
          error instanceof ZodError ? error.message : String(error)
        }`,
      );
      return getDefaultSettingValue(key);
    }
  }

  private validateForWrite(key: SettingKey, value: unknown): SettingValue {
    try {
      return validateSettingValue(key, value);
    } catch (error) {
      const message = error instanceof ZodError ? error.issues[0]?.message : String(error);
      throw new BadRequestException(`Invalid value for ${key}: ${message || 'validation failed'}`);
    }
  }
}
