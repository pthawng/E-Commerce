import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

export const getRedisConnectionOptions = (configService: ConfigService, moduleName: string) => {
  const logger = new Logger(`${moduleName}RedisConfig`);
  const url = process.env.REDIS_URL || configService.get<string>('REDIS_URL');

  if (url && url.trim() !== '') {
    logger.log(`[${moduleName}] Connecting via URL (length: ${url.length})`);
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

  return {
    host: process.env.REDIS_HOST || configService.get('REDIS_HOST') || 'localhost',
    port: Number(process.env.REDIS_PORT || configService.get('REDIS_PORT') || 6379),
    password: process.env.REDIS_PASSWORD || configService.get('REDIS_PASSWORD'),
  };
};

export const bullConfigFactory = async (configService: ConfigService) => {
  const redisOptions = getRedisConnectionOptions(configService, 'Bull');

  if (redisOptions.host) {
    return {
      redis: {
        ...redisOptions,
        maxRetriesPerRequest: null,
      },
    };
  }

  return { redis: redisOptions.redis || 'localhost:6379' };
};

export const cacheConfigFactory = async (configService: ConfigService) => {
  const logger = new Logger('CacheConfig');
  const url = process.env.REDIS_URL || configService.get<string>('REDIS_URL');
  const host = process.env.REDIS_HOST || configService.get('REDIS_HOST') || 'localhost';
  const port = process.env.REDIS_PORT || configService.get('REDIS_PORT') || 6379;
  const password = process.env.REDIS_PASSWORD || configService.get('REDIS_PASSWORD');

  const redisUrl =
    url && url.trim() !== ''
      ? url
      : password
        ? `redis://:${password}@${host}:${port}`
        : `redis://${host}:${port}`;

  const isTls = redisUrl.startsWith('rediss://');
  logger.log(
    `[Cache] Using Redis at ${redisUrl.split('@')[1] || redisUrl.split('//')[1] || 'localhost'} (TLS: ${isTls})`,
  );

  return {
    store: await redisStore({
      url: redisUrl,
      ttl: configService.get('REDIS_TTL') || 600,
      ...(isTls ? { tls: {} } : {}),
    }),
  };
};
