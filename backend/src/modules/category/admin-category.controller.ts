import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { PERMISSIONS } from '@modules/rbac/permissions.constants';
import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('admin-categories')
@ApiBearerAuth()
@Controller('admin/categories')
@UseGuards(PermissionGuard)
export class AdminCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới danh mục (Admin)' })
  @ApiResponse({ status: 201, description: 'Danh mục mới được tạo' })
  @Permission({
    permissions: [PERMISSIONS.PRODUCT.CATEGORY.CREATE],
    mode: 'any',
  })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật danh mục (Admin)' })
  @ApiResponse({ status: 200, description: 'Danh mục sau khi cập nhật' })
  @Permission({
    permissions: [PERMISSIONS.PRODUCT.CATEGORY.UPDATE],
    mode: 'any',
  })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá danh mục (Admin)' })
  @ApiResponse({ status: 200, description: 'Thông báo xoá danh mục' })
  @Permission({
    permissions: [PERMISSIONS.PRODUCT.CATEGORY.DELETE],
    mode: 'any',
  })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.categoryService.remove(id);
  }
}
