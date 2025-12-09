import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { PaginationDto } from 'src/common/pagination';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './services/product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // GET ALL PRODUCTS (PAGINATED)
  @Get()
  findAllPaginated(@Query() dto: PaginationDto) {
    return this.productService.findAllPaginated(dto);
  }

  // GET PRODUCT BY ID
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productService.findOne(id);
  }

  // GET PRODUCT BY SLUG
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }

  // CREATE PRODUCT
  @Post()
  createProduct(@Body() dto: CreateProductDto) {
    return this.productService.createProduct(dto);
  }
}
