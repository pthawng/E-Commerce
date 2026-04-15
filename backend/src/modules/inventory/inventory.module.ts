import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { InventoryAllocatorService } from './inventory-allocator.service';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { StockMovementService } from './stock-movement.service';
import { WarehouseService } from './warehouse.service';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryController],
  providers: [WarehouseService, InventoryService, InventoryAllocatorService, StockMovementService],
  exports: [InventoryService, InventoryAllocatorService],
})
export class InventoryModule {}
