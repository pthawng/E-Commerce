import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { getRedisConnectionOptions } from '../../config/redis.config';
import { DistributedLockService } from './distributed-lock.service';
import { TracingService } from './tracing.service';


@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const options = getRedisConnectionOptions(configService, 'Infra');
        return new Redis({
          ...options,
          maxRetriesPerRequest: null,
        });
      },
      inject: [ConfigService],
    },
    DistributedLockService,
    TracingService,
  ],
  exports: ['REDIS_CLIENT', DistributedLockService, TracingService],

})
export class InfraModule {}
