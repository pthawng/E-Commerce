/**
 * ABAC Module
 * Module cho Attribute-Based Access Control system
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AbacGuard } from './guard/abac.guard';
import { OrderPolicy } from './OrderPolicy';
import { PolicyEngineService } from './services/policy-engine.service';

@Module({
  imports: [PrismaModule],
  providers: [
    PolicyEngineService,
    AbacGuard,
    // Register all policies here
    OrderPolicy,
  ],
  exports: [PolicyEngineService, AbacGuard],
})
export class AbacModule {}

