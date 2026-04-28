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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AttributeService } from './attribute.service';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';

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
