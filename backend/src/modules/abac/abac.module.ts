/**
 * ABAC Module
 * Module cho Attribute-Based Access Control system
 */

import { Module } from '@nestjs/common';
import { RbacModule } from 'src/modules/rbac/rbac.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AbacGuard } from './guard/abac.guard';
import { OrderPolicy } from './policy/OrderPolicy';
import { UserPolicy } from './policy/UserPolicy';
import { PolicyEngineService } from './services/policy-engine.service';
@Module({
  imports: [PrismaModule, RbacModule],
  providers: [
    PolicyEngineService,
    AbacGuard,
    // Register all policies here
    OrderPolicy,
    UserPolicy,
  ],
  exports: [PolicyEngineService, AbacGuard],
})
export class AbacModule {}
