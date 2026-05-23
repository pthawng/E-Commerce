import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { CategoryService } from './category.service';
import { CategoryTreeQueryDto } from './dto/category-tree-query.dto';

@ApiTags('categories')
@Controller('categories')
@UseGuards(PermissionGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // GET TREE
  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy tree danh mục' })
  @ApiResponse({ status: 200, description: 'Danh sách danh mục dạng cây' })
  findTree(@Query() query: CategoryTreeQueryDto) {
    return this.categoryService.findTree(query.includeInactive, true);
  }

  // GET BY SLUG
  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Lấy danh mục theo slug' })
  @ApiResponse({ status: 200, description: 'Chi tiết danh mục' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }

  // GET BY ID
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy danh mục theo ID' })
  @ApiResponse({ status: 200, description: 'Chi tiết danh mục' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.categoryService.findOne(id);
  }
}
