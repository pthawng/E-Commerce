import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  AdjustStockDto,
  CreateWarehouseDto,
  ReceiveStockDto,
  StockQueryDto,
  TransferStockDto,
  UpdateWarehouseDto,
} from './dto';
import { InventoryService } from './inventory.service';
import { StockMovementService } from './stock-movement.service';
import { WarehouseService } from './warehouse.service';

/**
 * Inventory controller.
 * Exposes endpoints for managing warehouses, stock levels, stock operations, and transfers.
 */
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly inventoryService: InventoryService,
    private readonly stockMovementService: StockMovementService,
  ) {}

  /**
   * Retrieves all warehouses.
   */
  @Get('warehouses')
  async getWarehouses() {
    return this.warehouseService.findAll();
  }

  /**
   * Creates a new warehouse.
   */
  @Post('warehouses')
  async createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.warehouseService.create(dto);
  }

  /**
   * Updates an existing warehouse.
   */
  @Patch('warehouses/:id')
  async updateWarehouse(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehouseService.update(id, dto);
  }

  /**
   * Retrieves stock levels matching optional filters.
   */
  @Get('stock')
  async getAllStockLevels(
    @Query('warehouseId') warehouseId?: string,
    @Query('variantId') variantId?: string,
  ) {
    return this.inventoryService.getAllStockLevels({ warehouseId, variantId });
  }

  /**
   * Retrieves stock levels for a specific variant.
   */
  @Get('stock/:variantId')
  async getStockLevels(@Param('variantId') variantId: string) {
    return this.inventoryService.getStockLevels(variantId);
  }

  /**
   * Receives incoming stock.
   */
  @Post('receive')
  async receiveStock(@Body() dto: ReceiveStockDto) {
    await this.inventoryService.receiveStock(
      dto.variantId,
      dto.warehouseId,
      dto.quantity,
      undefined, // Actor ID (extracted from JWT)
      dto.note,
    );
    return { message: `Received ${dto.quantity} units successfully` };
  }

  /**
   * Adjusts stock quantity levels.
   */
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

  /**
   * Transfers stock between warehouses.
   */
  @Post('transfer')
  async transferStock(@Body() dto: TransferStockDto) {
    await this.stockMovementService.transfer(
      dto.variantId,
      dto.fromWarehouseId,
      dto.toWarehouseId,
      dto.quantity,
      undefined,
      dto.note,
    );
    return { message: `Transferred ${dto.quantity} units successfully` };
  }

  /**
   * Reports damaged stock.
   */
  @Post('damage')
  async reportDamage(@Body() dto: AdjustStockDto) {
    await this.inventoryService.reportDamage(
      dto.variantId,
      dto.warehouseId,
      dto.quantity || 0,
      undefined,
      dto.reason,
    );
    return { message: 'Damage reported successfully' };
  }

  /**
   * Retrieves stock movement logs.
   */
  @Get('logs')
  async getMovementHistory(@Query() query: StockQueryDto) {
    return this.stockMovementService.getMovementHistory(query);
  }

  /**
   * Retrieves active transfers.
   */
  @Get('transfers')
  async getTransfers() {
    return this.stockMovementService.getTransfers();
  }

  /**
   * Initiates a stock transfer.
   */
  @Post('transfers')
  async initiateTransfer(@Body() dto: TransferStockDto) {
    return this.stockMovementService.createTransfer(
      dto.variantId,
      dto.fromWarehouseId,
      dto.toWarehouseId,
      dto.quantity,
      undefined,
      dto.note,
    );
  }

  /**
   * Marks a transfer as shipped.
   */
  @Post('transfers/:id/ship')
  async shipTransfer(@Param('id') id: string) {
    return this.stockMovementService.shipTransfer(id);
  }

  /**
   * Marks a transfer as received.
   */
  @Post('transfers/:id/receive')
  async receiveTransfer(@Param('id') id: string) {
    return this.stockMovementService.receiveTransfer(id);
  }
}
