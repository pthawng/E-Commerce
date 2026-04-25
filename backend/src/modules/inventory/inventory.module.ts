import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { InventoryAllocatorService } from './inventory-allocator.service';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { StockMovementService } from './stock-movement.service';
import { WarehouseService } from './warehouse.service';
import { PhysicalItemService } from './physical-item.service';

import { InventoryReconciliationService } from './inventory-reconciliation.service';

@Module({
  imports: [PrismaModule],
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
export class InventoryModule { }
