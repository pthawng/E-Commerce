import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

export const getRedisConnectionOptions = (configService: ConfigService, moduleName: string) => {
  const logger = new Logger(`${moduleName}RedisConfig`);
  const url = configService.get<string>('REDIS_URL');

  if (url && url.trim() !== '') {
    logger.log(`[${moduleName}] Connecting via URL`);
    const isTls = url.startsWith('rediss://');

    try {
      const match =
        url.match(/rediss?:\/\/:(.*)@(.*):(\d+)/) || url.match(/rediss?:\/\/(.*):(\d+)/);
      if (match && match.length >= 3) {
        if (match.length === 4) {
          return {
            password: match[1],
            host: match[2],
            port: parseInt(match[3], 10),
            tls: isTls ? {} : undefined,
          };
        } else {
          return {
            host: match[1],
            port: parseInt(match[2], 10),
            tls: isTls ? {} : undefined,
          };
        }
      } else {
        return { redis: url, tls: isTls ? {} : undefined };
      }
    } catch {
      return { redis: url };
    }
  }

  const rawHost = configService.get<string>('REDIS_HOST') || 'localhost';
  const rawPort = configService.get<number>('REDIS_PORT') || 6379;

  let host = rawHost;
  let port = rawPort;

  if (rawHost.includes(':')) {
    const parts = rawHost.split(':');
    host = parts[0];
    port = parseInt(parts[1], 10);
  }

  return {
    host,
    port,
    password: configService.get<string>('REDIS_PASSWORD') || undefined,
  };
};

export const bullConfigFactory = async (configService: ConfigService) => {
  const redisOptions = getRedisConnectionOptions(configService, 'Bull');

  return {
    redis: {
      ...redisOptions,
      maxRetriesPerRequest: null,
    },
  };
};

export const cacheConfigFactory = async (configService: ConfigService) => {
  const url = configService.get<string>('REDIS_URL');
  const redisOptions = getRedisConnectionOptions(configService, 'Cache');

  // If we have a full URL (Production preference), use it directly
  if (url && url.trim() !== '') {
    return {
      store: await redisStore({
        url: url.trim(),
        ttl: configService.get<number>('REDIS_TTL') || 60000,
        ...(url.startsWith('rediss://') ? { tls: {} } : {}),
      } as any),
    };
  }

  // Fallback to structured socket (Dev/Split config)
  return {
    store: await redisStore({
      socket: {
        host: redisOptions.host,
        port: redisOptions.port,
        tls: redisOptions.tls ? true : false,
        reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
      },
      password: redisOptions.password,
      ttl: configService.get<number>('REDIS_TTL') || 60000,
    } as any),
  };
};
