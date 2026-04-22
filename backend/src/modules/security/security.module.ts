import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { OwnershipRegistry } from './ownership.registry';
import { SecurityEventBus } from './security-event-bus.service';
import { SecurityOrchestrator } from './security-orchestrator.service';

@Global()
@Module({
  imports: [PrismaModule, ConfigModule, JwtModule],
  providers: [OwnershipRegistry, SecurityEventBus, SecurityOrchestrator],
  exports: [OwnershipRegistry, SecurityEventBus],
})
export class SecurityModule {}
