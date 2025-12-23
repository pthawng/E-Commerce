import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { parse } from 'pg-connection-string';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly connectionString: string;
  private readonly dbInfo: { host: string; port: string; database: string; user: string };

  constructor() {
    const connStr = process.env.DATABASE_URL || '';
    const adapter = new PrismaPg({ connectionString: connStr });
    super({ adapter });

    this.connectionString = connStr;

    // parse connection string ra host/port/db/user
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
