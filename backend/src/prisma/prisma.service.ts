import { SystemContextStore } from '@common/context/system-context.store';
import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { parse } from 'pg-connection-string';

import { softDeleteExtension } from './extensions/soft-delete.extension';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly dbInfo: { host: string; port: string; database: string; user: string };

  constructor(private readonly configService: ConfigService) {
    const connStr = configService.getOrThrow<string>('DATABASE_URL');
    const pool = new Pool({ connectionString: connStr });
    const adapter = new PrismaPg(pool);
    super({ adapter });

    const parsed = parse(connStr);
    this.dbInfo = {
      host: parsed.host ?? 'unknown',
      port: parsed.port ?? '5432',
      database: parsed.database ?? 'unknown',
      user: parsed.user ?? 'unknown',
    };

    // Chain Extensions: Soft Delete + Invariant Guard
    return this.$extends(softDeleteExtension).$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const sensitiveModels = ['InventoryItem', 'Order', 'Payment', 'InventoryReservation'];
            const mutationActions = [
              'create',
              'update',
              'upsert',
              'delete',
              'updateMany',
              'deleteMany',
            ];

            if (model && sensitiveModels.includes(model) && mutationActions.includes(operation)) {
              if (!SystemContextStore.isInternalService) {
                Logger.error(
                  `❌ INVARIANT VIOLATION: Unauthorized mutation on ${model}.${operation} outside service layer!`,
                  'PrismaService',
                );
                throw new BadRequestException(
                  `System Invariant Violation: Direct mutation on ${model} is forbidden. Use the designated service layer.`,
                );
              }
            }

            return query(args);
          },
        },
      },
    }) as any;
  }

  async onModuleInit() {
    await this._connectWithRetry();
  }

  private async _connectWithRetry(retries = 5, backoff = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        await this.$connect();
        await this.$queryRaw`SELECT 1`;
        this.logger.log(
          `✅ Successfully connected to the database "${this.dbInfo.database}" at ${this.dbInfo.host}:${this.dbInfo.port}`,
        );
        return;
      } catch (error) {
        const isLastRetry = i === retries - 1;
        this.logger.error(
          `❌ [Attempt ${i + 1}/${retries}] Failed to connect to DB at ${this.dbInfo.host}:${this.dbInfo.port}. ${isLastRetry ? 'Final attempt failed.' : `Retrying in ${backoff}ms...`}`,
        );
        if (isLastRetry) throw error;
        await new Promise((resolve) => setTimeout(resolve, backoff));
        backoff *= 2; // Exponential backoff
      }
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Database connection closed.');
    } catch (error) {
      this.logger.error('Failed to disconnect database.', error);
    }
  }
}
