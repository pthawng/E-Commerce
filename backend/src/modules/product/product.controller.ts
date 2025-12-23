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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { PaginationDto } from 'src/common/pagination';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

@ApiTags('products')
@Controller('products')
@UseGuards(PermissionGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // GET ALL PRODUCTS (PAGINATED)
  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm (phân trang)' })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm kèm meta phân trang' })
  findAllPaginated(@Query() dto: PaginationDto) {
    return this.productService.findAllPaginated(dto);
  }

  // GET PRODUCT BY ID
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy sản phẩm theo ID' })
  @ApiResponse({ status: 200, description: 'Chi tiết sản phẩm' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productService.findOne(id);
  }

  // GET PRODUCT BY SLUG
  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Lấy sản phẩm theo slug' })
  @ApiResponse({ status: 200, description: 'Chi tiết sản phẩm theo slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }

  // CREATE PRODUCT
  // [SECURE] Remove @Public() -> Require Login + Permission
  @Post()
  @Permission(PERMISSIONS.PRODUCT.ITEM.CREATE)
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: 'Tạo mới sản phẩm (có thể upload nhiều ảnh)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Sản phẩm mới được tạo kèm ảnh (nếu có)' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc file ảnh không hợp lệ' })
  createProduct(@Body() dto: CreateProductDto, @UploadedFiles() files?: Express.Multer.File[]) {
    return this.productService.createProduct(dto, files);
  }

  // UPDATE PRODUCT
  @Patch(':id')
  @Permission(PERMISSIONS.PRODUCT.ITEM.UPDATE)
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: 'Cập nhật sản phẩm (có thể upload thêm ảnh)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Sản phẩm sau khi cập nhật kèm ảnh mới (nếu có)' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc file ảnh không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Sản phẩm không tồn tại' })
  updateProduct(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.productService.updateProduct(id, dto, files);
  }
}
