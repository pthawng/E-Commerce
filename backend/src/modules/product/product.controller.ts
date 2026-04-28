import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { PERMISSIONS } from '@modules/rbac/permissions.constants';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from 'src/common/decorators/public.decorator';
import { PaginationRateLimitGuard } from 'src/common/guards/pagination-rate-limit.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

@ApiTags('products')
@Controller('products')
@UseGuards(PermissionGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @UseGuards(PaginationRateLimitGuard)
  @Throttle({ fast: { limit: 100, ttl: 60000 } })
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm (phân trang)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Danh sách sản phẩm kèm meta phân trang' })
  findAllPaginated(@Query() dto: ProductQueryDto) {
    return this.productService.findAllPaginated(dto);
  }

  // GET PRODUCT BY ID
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy sản phẩm theo ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chi tiết sản phẩm' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productService.findOne(id);
  }

  // GET PRODUCT BY SLUG
  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Lấy sản phẩm theo slug' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chi tiết sản phẩm theo slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }

}
