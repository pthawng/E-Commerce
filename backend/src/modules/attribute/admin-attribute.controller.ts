import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { PERMISSIONS } from '@modules/rbac/permissions.constants';
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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AttributeService } from './attribute.service';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';

@ApiTags('admin-attributes')
@ApiBearerAuth()
@Controller('admin/attributes')
@UseGuards(PermissionGuard)
export class AdminAttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách attribute (kèm values) (Admin)' })
  @Permission({
    permissions: [PERMISSIONS.PRODUCT.ATTRIBUTE.READ],
    mode: 'any',
  })
  findAll() {
    return this.attributeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết attribute (kèm values) (Admin)' })
  @Permission({
    permissions: [PERMISSIONS.PRODUCT.ATTRIBUTE.READ],
    mode: 'any',
  })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.attributeService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo attribute (Admin)' })
  @ApiResponse({ status: 201, description: 'Attribute được tạo' })
  @Permission({
    permissions: [PERMISSIONS.PRODUCT.ATTRIBUTE.CREATE],
    mode: 'any',
  })
  create(@Body() dto: CreateAttributeDto) {
    return this.attributeService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật attribute (Admin)' })
  @Permission({
    permissions: [PERMISSIONS.PRODUCT.ATTRIBUTE.UPDATE],
    mode: 'any',
  })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateAttributeDto) {
    return this.attributeService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá attribute (Admin)' })
  @Permission({
    permissions: [PERMISSIONS.PRODUCT.ATTRIBUTE.DELETE],
    mode: 'any',
  })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.attributeService.remove(id);
  }

  @Get('values/all')
  @ApiOperation({
    summary: 'Danh sách tất cả attribute values (để chọn khi tạo/sửa attribute) (Admin)',
  })
  @Permission({
    permissions: [PERMISSIONS.PRODUCT.ATTRIBUTE.READ],
    mode: 'any',
  })
  listAllValues(@Query('search') search?: string) {
    return this.attributeService.listAllValues(search);
  }

  @Get(':attributeId/values')
  @ApiOperation({ summary: 'Danh sách value của attribute (Admin)' })
  @Permission({
    permissions: [PERMISSIONS.PRODUCT.ATTRIBUTE.READ],
    mode: 'any',
  })
  listValues(@Param('attributeId', new ParseUUIDPipe()) attributeId: string) {
    return this.attributeService.listValues(attributeId);
  }

  @Post(':attributeId/values')
  @ApiOperation({ summary: 'Tạo value cho attribute (Admin)' })
  @Permission({
    permissions: [PERMISSIONS.PRODUCT.ATTRIBUTE.CREATE],
    mode: 'any',
  })
  createValue(
    @Param('attributeId', new ParseUUIDPipe()) attributeId: string,
    @Body() dto: CreateAttributeValueDto,
  ) {
    return this.attributeService.createValue(attributeId, dto);
  }

  @Patch(':attributeId/values/:valueId')
  @ApiOperation({ summary: 'Cập nhật value (Admin)' })
  @Permission({
    permissions: [PERMISSIONS.PRODUCT.ATTRIBUTE.UPDATE],
    mode: 'any',
  })
  updateValue(
    @Param('attributeId', new ParseUUIDPipe()) attributeId: string,
    @Param('valueId', new ParseUUIDPipe()) valueId: string,
    @Body() dto: UpdateAttributeValueDto,
  ) {
    return this.attributeService.updateValue(attributeId, valueId, dto);
  }

  @Delete(':attributeId/values/:valueId')
  @ApiOperation({ summary: 'Xoá value (Admin)' })
  @Permission({
    permissions: [PERMISSIONS.PRODUCT.ATTRIBUTE.DELETE],
    mode: 'any',
  })
  removeValue(
    @Param('attributeId', new ParseUUIDPipe()) attributeId: string,
    @Param('valueId', new ParseUUIDPipe()) valueId: string,
  ) {
    return this.attributeService.removeValue(attributeId, valueId);
  }
}
