import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { PERMISSIONS } from '@modules/rbac/permissions.constants';
import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileValidationPipe } from 'src/common/pipes/file-validation.pipe';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

@ApiTags('admin-products')
@ApiBearerAuth()
@Controller('admin/products')
@UseGuards(PermissionGuard)
export class AdminProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Permission(PERMISSIONS.PRODUCT.ITEM.CREATE)
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: 'Tạo mới sản phẩm (Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Sản phẩm mới được tạo',
  })
  createProduct(
    @Body() dto: CreateProductDto,
    @UploadedFiles(new FileValidationPipe()) files?: Express.Multer.File[],
  ) {
    return this.productService.createProduct(dto, files);
  }

  @Patch(':id')
  @Permission(PERMISSIONS.PRODUCT.ITEM.UPDATE)
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: 'Cập nhật sản phẩm (Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sản phẩm sau khi cập nhật',
  })
  updateProduct(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles(new FileValidationPipe()) files?: Express.Multer.File[],
  ) {
    return this.productService.updateProduct(id, dto, files);
  }

  @Delete(':id')
  @Permission(PERMISSIONS.PRODUCT.ITEM.DELETE)
  @ApiOperation({ summary: 'Xóa sản phẩm (Soft Delete) (Admin)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sản phẩm đã được xóa thành công',
  })
  deleteProduct(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productService.deleteProduct(id);
  }
}
