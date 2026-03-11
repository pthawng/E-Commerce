import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { InventoryController } from './inventory.controller';
import { WarehouseService } from './warehouse.service';
import { InventoryService } from './inventory.service';
import { InventoryAllocatorService } from './inventory-allocator.service';
import { StockMovementService } from './stock-movement.service';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryController],
  providers: [
    WarehouseService,
    InventoryService,
    InventoryAllocatorService,
    StockMovementService,
  ],
  exports: [
    InventoryService,
    InventoryAllocatorService,
  ],
})
export class InventoryModule {}
