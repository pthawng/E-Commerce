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
  const logger = new Logger('CacheConfig');
  const url = configService.get<string>('REDIS_URL');
  const host = configService.get<string>('REDIS_HOST') || 'localhost';
  const port = configService.get<number>('REDIS_PORT') || 6379;
  const password = configService.get<string>('REDIS_PASSWORD');

  const redisUrl =
    url && url.trim() !== ''
      ? url
      : password
        ? `redis://:${password}@${host}${host.includes(':') ? '' : `:${port}`}`
        : `redis://${host}${host.includes(':') ? '' : `:${port}`}`;

  const isTls = redisUrl.startsWith('rediss://');
  logger.log(
    `[Cache] Using Redis at ${redisUrl.split('@')[1] || redisUrl.split('//')[1] || 'localhost'} (TLS: ${isTls})`,
  );

  return {
    store: await redisStore({
      url: redisUrl,
      ttl: configService.get<number>('REDIS_TTL') || 60000,
      ...(isTls ? { tls: {} } : {}),
    }),
  };
};
