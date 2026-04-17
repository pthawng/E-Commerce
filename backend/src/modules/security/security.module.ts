import { Global, Module } from '@nestjs/common';
import { OwnershipRegistry } from './ownership.registry';
import { SecurityEventBus } from './security-event-bus.service';
import { SecurityOrchestrator } from './security-orchestrator.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
    imports: [PrismaModule],
    providers: [OwnershipRegistry, SecurityEventBus, SecurityOrchestrator],
    exports: [OwnershipRegistry, SecurityEventBus],
})
export class SecurityModule { }
