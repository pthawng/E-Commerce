import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { CategoryService } from './category.service';
import { CategoryTreeQueryDto } from './dto/category-tree-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // GET TREE
  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy tree danh mục' })
  @ApiResponse({ status: 200, description: 'Danh sách danh mục dạng cây' })
  findTree(@Query() query: CategoryTreeQueryDto) {
    return this.categoryService.findTree(query.includeInactive);
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

  // CREATE
  @Public()
  @Post()
  @ApiOperation({ summary: 'Tạo mới danh mục' })
  @ApiResponse({ status: 201, description: 'Danh mục mới được tạo' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  // UPDATE
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật danh mục' })
  @ApiResponse({ status: 200, description: 'Danh mục sau khi cập nhật' })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  // DELETE
  @Delete(':id')
  @ApiOperation({ summary: 'Xoá danh mục' })
  @ApiResponse({ status: 200, description: 'Thông báo xoá danh mục' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.categoryService.remove(id);
  }
}
