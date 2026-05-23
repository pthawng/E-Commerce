import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttributeService } from './attribute.service';

@ApiTags('attributes')
@Controller('attributes')
@UseGuards(PermissionGuard)
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách attribute (kèm values)' })
  findAll() {
    return this.attributeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết attribute (kèm values)' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.attributeService.findOne(id);
  }

  @Get(':attributeId/values')
  @ApiOperation({ summary: 'Danh sách value của attribute' })
  listValues(@Param('attributeId', new ParseUUIDPipe()) attributeId: string) {
    return this.attributeService.listValues(attributeId);
  }
}
