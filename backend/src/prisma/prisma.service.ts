import { SystemContextStore } from '@common/context/system-context.store';
import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { parse } from 'pg-connection-string';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly connectionString: string;
  private readonly dbInfo: { host: string; port: string; database: string; user: string };

  constructor() {
    const connStr = process.env.DATABASE_URL || '';
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

    this.logger.log(
      `PrismaService initialized. DB Info: host=${this.dbInfo.host}, port=${this.dbInfo.port}, database=${this.dbInfo.database}, user=${this.dbInfo.user}`,
    );

    // Modern Prisma Extension for Invariant Guard (Replaces deprecated $use)
    return this.$extends({
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
    try {
      await this.$connect();
      // test connection thật sự
      await this.$queryRaw`SELECT 1`;
      this.logger.log(
        `✅ Successfully connected to the database "${this.dbInfo.database}" at ${this.dbInfo.host}:${this.dbInfo.port}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to connect to the database "${this.dbInfo.database}" at ${this.dbInfo.host}:${this.dbInfo.port}`,
        error,
      );
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
