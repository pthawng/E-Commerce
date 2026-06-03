import { BackOfficeAuthGuard } from '@modules/back-office-auth/guards/back-office-auth.guard';
import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { PERMISSIONS } from '@modules/rbac/permissions.constants';
import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipJwtAuth } from 'src/common/decorators/skip-jwt-auth.decorator';
import {
  AdjustStockDto,
  CreateWarehouseDto,
  ReceiveStockDto,
  ResolveDiscrepancyDto,
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
@ApiTags('back-office-inventory')
@ApiBearerAuth()
@SkipJwtAuth()
@Controller('inventory')
@UseGuards(BackOfficeAuthGuard, PermissionGuard)
export class InventoryController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly inventoryService: InventoryService,
    private readonly stockMovementService: StockMovementService,
  ) {}

  /**
   * Retrieves dashboard overview statistics.
   */
  @Get('overview')
  @Permission(PERMISSIONS.INVENTORY.READ)
  async getOverview() {
    return this.inventoryService.getOverviewStats();
  }

  /**
   * Retrieves all warehouses.
   */
  @Get('warehouses')
  @Permission(PERMISSIONS.INVENTORY.READ)
  async getWarehouses() {
    return this.warehouseService.findAll();
  }

  /**
   * Creates a new warehouse.
   */
  @Post('warehouses')
  @Permission(PERMISSIONS.INVENTORY.MANAGE)
  async createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.warehouseService.create(dto);
  }

  /**
   * Updates an existing warehouse.
   */
  @Patch('warehouses/:id')
  @Permission(PERMISSIONS.INVENTORY.MANAGE)
  async updateWarehouse(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehouseService.update(id, dto);
  }

  /**
   * Retrieves stock levels matching optional filters.
   */
  @Get('stock')
  @Permission(PERMISSIONS.INVENTORY.READ)
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
  @Permission(PERMISSIONS.INVENTORY.READ)
  async getStockLevels(@Param('variantId') variantId: string) {
    return this.inventoryService.getStockLevels(variantId);
  }

  /**
   * Receives incoming stock.
   */
  @Post('receive')
  @Permission(PERMISSIONS.INVENTORY.ADJUST)
  async receiveStock(@Body() dto: ReceiveStockDto, @Req() req: any) {
    await this.inventoryService.receiveStock(
      dto.variantId,
      dto.warehouseId,
      dto.quantity,
      req.user?.id || req.user?.userId,
      dto.note,
    );
    return { message: `Received ${dto.quantity} units successfully` };
  }

  /**
   * Adjusts stock quantity levels.
   */
  @Post('adjust')
  @Permission(PERMISSIONS.INVENTORY.ADJUST)
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
  @Permission(PERMISSIONS.INVENTORY.TRANSFER)
  async transferStock(@Body() dto: TransferStockDto, @Req() req: any) {
    await this.stockMovementService.transfer(
      dto.variantId,
      dto.fromWarehouseId,
      dto.toWarehouseId,
      dto.quantity,
      req.user?.id || req.user?.userId,
      dto.note,
    );
    return { message: `Transferred ${dto.quantity} units successfully` };
  }

  /**
   * Reports damaged stock.
   */
  @Post('damage')
  @Permission(PERMISSIONS.INVENTORY.ADJUST)
  async reportDamage(@Body() dto: AdjustStockDto, @Req() req: any) {
    await this.inventoryService.reportDamage(
      dto.variantId,
      dto.warehouseId,
      dto.quantity || 0,
      req.user?.id || req.user?.userId,
      dto.reason,
    );
    return { message: 'Damage reported successfully' };
  }

  /**
   * Retrieves stock movement logs.
   */
  @Get('logs')
  @Permission(PERMISSIONS.INVENTORY.READ)
  async getMovementHistory(@Query() query: StockQueryDto) {
    return this.stockMovementService.getMovementHistory(query);
  }

  /**
   * Retrieves active transfers.
   */
  @Get('transfers')
  @Permission(PERMISSIONS.INVENTORY.READ)
  async getTransfers() {
    return this.stockMovementService.getTransfers();
  }

  /**
   * Initiates a stock transfer.
   */
  @Post('transfers')
  @Permission(PERMISSIONS.INVENTORY.TRANSFER)
  async initiateTransfer(@Body() dto: TransferStockDto, @Req() req: any) {
    return this.stockMovementService.createTransfer(
      dto.variantId,
      dto.fromWarehouseId,
      dto.toWarehouseId,
      dto.quantity,
      req.user?.id || req.user?.userId,
      dto.note,
    );
  }

  /**
   * Marks a transfer as approved.
   */
  @Patch('transfers/:id/approve')
  @Permission(PERMISSIONS.INVENTORY.TRANSFER)
  async approveTransfer(@Param('id') id: string, @Req() req: any) {
    return this.stockMovementService.approveTransfer(id, req.user?.id || req.user?.userId);
  }

  /**
   * Marks a transfer as rejected.
   */
  @Patch('transfers/:id/reject')
  @Permission(PERMISSIONS.INVENTORY.TRANSFER)
  async rejectTransfer(
    @Param('id') id: string,
    @Body('note') note: string | undefined,
    @Req() req: any,
  ) {
    return this.stockMovementService.rejectTransfer(id, req.user?.id || req.user?.userId, note);
  }

  /**
   * Marks a transfer as shipped.
   */
  @Post('transfers/:id/ship')
  @Permission(PERMISSIONS.INVENTORY.TRANSFER)
  async shipTransfer(@Param('id') id: string, @Req() req: any) {
    return this.stockMovementService.shipTransfer(id, req.user?.id || req.user?.userId);
  }

  /**
   * Marks a transfer as received.
   */
  @Post('transfers/:id/receive')
  @Permission(PERMISSIONS.INVENTORY.TRANSFER)
  async receiveTransfer(@Param('id') id: string, @Req() req: any) {
    return this.stockMovementService.receiveTransfer(id, req.user?.id || req.user?.userId);
  }

  /**
   * Resolves a discrepancy for a physical item.
   */
  @Post('discrepancies/:id/resolve')
  @Permission(PERMISSIONS.INVENTORY.ADJUST)
  async resolveDiscrepancy(
    @Param('id') id: string,
    @Body() dto: ResolveDiscrepancyDto,
    @Req() req: any,
  ) {
    return this.inventoryService.resolveDiscrepancy(
      id,
      dto.action,
      dto.targetStatus,
      req.user?.id || req.user?.userId,
      dto.note,
    );
  }
}
