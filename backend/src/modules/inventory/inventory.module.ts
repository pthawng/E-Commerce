import { BackOfficeAuthModule } from '@modules/back-office-auth/back-office-auth.module';
import { RbacModule } from '@modules/rbac/rbac.module';
import { SystemModule } from '@modules/system/system.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { InventoryAllocatorService } from './inventory-allocator.service';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PhysicalItemService } from './physical-item.service';
import { StockMovementService } from './stock-movement.service';
import { WarehouseService } from './warehouse.service';

import { InventoryReconciliationService } from './inventory-reconciliation.service';

@Module({
  imports: [PrismaModule, BackOfficeAuthModule, RbacModule, SystemModule],
  controllers: [InventoryController],
  providers: [
    WarehouseService,
    InventoryService,
    InventoryAllocatorService,
    StockMovementService,
    PhysicalItemService,
    InventoryReconciliationService,
  ],
  exports: [InventoryService, InventoryAllocatorService, PhysicalItemService],
})
export class InventoryModule {}
