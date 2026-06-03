import { BackOfficeAuthGuard } from '@modules/back-office-auth/guards/back-office-auth.guard';
import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { PERMISSIONS } from '@modules/rbac/permissions.constants';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SkipJwtAuth } from 'src/common/decorators/skip-jwt-auth.decorator';
import { CatalogService } from './catalog.service';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { ChangeProductStatusDto } from './dto/change-product-status.dto';
import { CreateCatalogProductDto } from './dto/create-catalog-product.dto';
import { ImportCatalogDto } from './dto/import-catalog.dto';
import { UpdatePricingFormulaDto } from './dto/pricing-formula.dto';
import { UpdateCatalogProductDto } from './dto/update-catalog-product.dto';

type RequestWithUser = Request & { user?: { userId?: string; id?: string } };

@ApiTags('back-office-catalog')
@ApiBearerAuth()
@SkipJwtAuth()
@Controller('back-office/catalog')
@UseGuards(BackOfficeAuthGuard, PermissionGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  @Permission(PERMISSIONS.CATALOG.PRODUCT.READ)
  findProducts(@Query() query: CatalogQueryDto) {
    return this.catalogService.findProducts(query);
  }

  @Get('overview')
  @Permission(PERMISSIONS.CATALOG.PRODUCT.READ)
  getOverview() {
    return this.catalogService.getOverview();
  }

  @Get('filters')
  @Permission(PERMISSIONS.CATALOG.PRODUCT.READ)
  getFilters() {
    return this.catalogService.getFilters();
  }

  @Get('pricing-formula')
  @Permission(PERMISSIONS.CATALOG.PRICING.READ)
  getPricingFormula() {
    return this.catalogService.getPricingFormula();
  }

  @Patch('pricing-formula')
  @Permission(PERMISSIONS.CATALOG.PRICING.UPDATE)
  updatePricingFormula(@Body() dto: UpdatePricingFormulaDto) {
    return this.catalogService.updatePricingFormula(dto);
  }

  @Get('products/:id')
  @Permission(PERMISSIONS.CATALOG.PRODUCT.READ)
  getProduct(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.catalogService.getProduct(id);
  }

  @Post('products')
  @Permission(PERMISSIONS.CATALOG.PRODUCT.CREATE)
  createProduct(@Body() dto: CreateCatalogProductDto, @Req() req: RequestWithUser) {
    return this.catalogService.createProduct(dto, req.user?.userId ?? req.user?.id);
  }

  @Patch('products/:id')
  @Permission(PERMISSIONS.CATALOG.PRODUCT.UPDATE)
  updateProduct(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCatalogProductDto,
    @Req() req: RequestWithUser,
  ) {
    return this.catalogService.updateProduct(id, dto, req.user?.userId ?? req.user?.id);
  }

  @Patch('products/:id/status')
  @Permission(PERMISSIONS.CATALOG.PRODUCT.PUBLISH)
  changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ChangeProductStatusDto,
    @Req() req: RequestWithUser,
  ) {
    return this.catalogService.changeStatus(id, dto, req.user?.userId ?? req.user?.id);
  }

  @Post('import')
  @Permission(PERMISSIONS.CATALOG.IMPORT.CREATE)
  importCatalog(@Body() dto: ImportCatalogDto, @Req() req: RequestWithUser) {
    return this.catalogService.importCatalog(dto, req.user?.userId ?? req.user?.id);
  }
}
