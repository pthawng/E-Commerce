import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { InventoryService } from './inventory.service';
import { StockMovementService } from './stock-movement.service';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  ReceiveStockDto,
  AdjustStockDto,
  TransferStockDto,
  StockQueryDto,
} from './dto';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly inventoryService: InventoryService,
    private readonly stockMovementService: StockMovementService,
  ) {}

  // ============================================
  // WAREHOUSE ENDPOINTS
  // ============================================

  @Get('warehouses')
  async getWarehouses() {
    return this.warehouseService.findAll();
  }

  @Post('warehouses')
  async createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.warehouseService.create(dto);
  }

  @Patch('warehouses/:id')
  async updateWarehouse(
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    return this.warehouseService.update(id, dto);
  }

  // ============================================
  // STOCK LEVEL ENDPOINTS
  // ============================================

  @Get('stock')
  async getAllStockLevels(
    @Query('warehouseId') warehouseId?: string,
    @Query('variantId') variantId?: string,
  ) {
    return this.inventoryService.getAllStockLevels({ warehouseId, variantId });
  }

  @Get('stock/:variantId')
  async getStockLevels(@Param('variantId') variantId: string) {
    return this.inventoryService.getStockLevels(variantId);
  }

  // ============================================
  // STOCK OPERATIONS
  // ============================================

  @Post('receive')
  async receiveStock(@Body() dto: ReceiveStockDto) {
    await this.inventoryService.receiveStock(
      dto.variantId,
      dto.warehouseId,
      dto.quantity,
      undefined, // actorId — can be extracted from JWT later
      dto.note,
    );
    return { message: `Received ${dto.quantity} units successfully` };
  }

  @Post('adjust')
  async adjustStock(@Body() dto: AdjustStockDto) {
    await this.inventoryService.adjustStock(
      dto.variantId,
      dto.warehouseId,
      dto.newQuantity,
      dto.reason,
    );
    return { message: 'Stock adjusted successfully' };
  }

  @Post('transfer')
  async transferStock(@Body() dto: TransferStockDto) {
    await this.stockMovementService.transfer(
      dto.variantId,
      dto.fromWarehouseId,
      dto.toWarehouseId,
      dto.quantity,
      undefined, // actorId
      dto.note,
    );
    return { message: `Transferred ${dto.quantity} units successfully` };
  }

  @Post('damage')
  async reportDamage(@Body() dto: AdjustStockDto) {
    await this.inventoryService.reportDamage(
      dto.variantId,
      dto.warehouseId,
      dto.quantity || 0, // Using quantity from AdjustStockDto
      undefined, // actorId
      dto.reason,
    );
    return { message: 'Damage reported successfully' };
  }

  // ============================================
  // MOVEMENT HISTORY
  // ============================================

  @Get('logs')
  async getMovementHistory(@Query() query: StockQueryDto) {
    return this.stockMovementService.getMovementHistory(query);
  }
}
