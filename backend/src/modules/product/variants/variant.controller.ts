import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CheckPolicy } from 'src/modules/abac/decorators/policy.decorator';
import { AbacGuard } from 'src/modules/abac/guard/abac.guard';
import { PolicyAction } from 'src/modules/abac/types/policy.types';
import { CreateVariantDto } from '../dto/variant/create-variant.dto';
import { UpdateVariantDto } from '../dto/variant/update-variant.dto';
import { VariantPolicy } from './variant.policy';
import { VariantService } from './variant.service';

@ApiTags('product variants')
@Controller('products/:productId/variants')
@UseGuards(AbacGuard)
export class VariantController {
  constructor(private readonly variantService: VariantService) {}

  // LIST variants by product
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách variant của sản phẩm' })
  @CheckPolicy(VariantPolicy, PolicyAction.READ)
  findByProduct(@Param('productId', new ParseUUIDPipe()) productId: string) {
    return this.variantService.findByProduct(productId);
  }

  // GET one variant
  @Get(':variantId')
  @ApiOperation({ summary: 'Lấy chi tiết variant' })
  @CheckPolicy(VariantPolicy, PolicyAction.READ, 'variantId')
  findOne(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Param('variantId', new ParseUUIDPipe()) variantId: string,
  ) {
    return this.variantService.findOne(productId, variantId);
  }

  // CREATE variant
  @Post()
  @ApiOperation({ summary: 'Tạo variant mới cho sản phẩm' })
  @ApiResponse({ status: 201, description: 'Variant được tạo' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @CheckPolicy(VariantPolicy, PolicyAction.CREATE, 'productId')
  create(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Body() body: CreateVariantDto,
  ) {
    return this.variantService.createVariant(productId, body);
  }

  // UPDATE variant
  @Patch(':variantId')
  @ApiOperation({ summary: 'Cập nhật variant' })
  @ApiResponse({ status: 200, description: 'Variant được cập nhật' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  @CheckPolicy(VariantPolicy, PolicyAction.UPDATE, 'variantId')
  update(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Param('variantId', new ParseUUIDPipe()) variantId: string,
    @Body() body: UpdateVariantDto,
  ) {
    return this.variantService.updateVariant(productId, variantId, body);
  }

  // DELETE variant
  @Delete(':variantId')
  @ApiOperation({ summary: 'Xoá variant' })
  @ApiResponse({ status: 200, description: 'Variant deleted' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  @CheckPolicy(VariantPolicy, PolicyAction.DELETE, 'variantId')
  remove(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Param('variantId', new ParseUUIDPipe()) variantId: string,
  ) {
    return this.variantService.deleteVariant(productId, variantId);
  }
}
