import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async check() {
    try {
      // L8 Tip: Check critical dependencies (DB, Redis) correctly
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: 'connected',
        },
      };
    } catch (error) {
      return {
        status: 'error',
        error: 'Database connection failed',
      };
    }
  }
}
