import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';

@Injectable()
export class AttributeService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------
  // Attribute CRUD
  // ---------------------------
  findAll() {
    return this.prisma.attribute.findMany({
      include: { values: { orderBy: { order: 'asc' } } },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const attribute = await this.prisma.attribute.findUnique({
      where: { id },
      include: { values: { orderBy: { order: 'asc' } } },
    });
    if (!attribute) throw new NotFoundException('Attribute không tồn tại');
    return attribute;
  }

  async create(dto: CreateAttributeDto) {
    // Unique code check
    const exist = await this.prisma.attribute.findUnique({ where: { code: dto.code } });
    if (exist) throw new BadRequestException('Mã attribute đã tồn tại');

    return this.prisma.attribute.create({
      data: {
        code: dto.code,
        name: dto.name as any,
        filterType: dto.filterType,
      },
    });
  }

  async update(id: string, dto: UpdateAttributeDto) {
    const attribute = await this.prisma.attribute.findUnique({ where: { id } });
    if (!attribute) throw new NotFoundException('Attribute không tồn tại');

    if (dto.code && dto.code !== attribute.code) {
      const exist = await this.prisma.attribute.findUnique({ where: { code: dto.code } });
      if (exist) throw new BadRequestException('Mã attribute đã tồn tại');
    }

    return this.prisma.attribute.update({
      where: { id },
      data: {
        code: dto.code ?? attribute.code,
        name: (dto.name as any) ?? attribute.name,
        filterType: dto.filterType ?? attribute.filterType,
      },
    });
  }

  async remove(id: string) {
    await this.ensureAttributeExists(id);
    await this.prisma.attribute.delete({ where: { id } });
    return { message: 'Đã xoá attribute' };
  }

  // ---------------------------
  // Attribute Value CRUD
  // ---------------------------
  async listValues(attributeId: string) {
    await this.ensureAttributeExists(attributeId);
    return this.prisma.attributeValue.findMany({
      where: { attributeId },
      orderBy: { order: 'asc' },
    });
  }

  async createValue(attributeId: string, dto: CreateAttributeValueDto) {
    await this.ensureAttributeExists(attributeId);

    return this.prisma.attributeValue.create({
      data: {
        attributeId,
        value: dto.value as any,
        metaValue: dto.metaValue,
        order: dto.order ?? 0,
      },
    });
  }

  async updateValue(attributeId: string, valueId: string, dto: UpdateAttributeValueDto) {
    const value = await this.prisma.attributeValue.findUnique({ where: { id: valueId } });
    if (!value) throw new NotFoundException('AttributeValue không tồn tại');
    if (value.attributeId !== attributeId) {
      throw new BadRequestException('AttributeValue không thuộc attribute này');
    }

    return this.prisma.attributeValue.update({
      where: { id: valueId },
      data: {
        value: (dto.value as any) ?? value.value,
        metaValue: dto.metaValue ?? value.metaValue,
        order: dto.order ?? value.order,
      },
    });
  }

  async removeValue(attributeId: string, valueId: string) {
    const value = await this.prisma.attributeValue.findUnique({ where: { id: valueId } });
    if (!value) throw new NotFoundException('AttributeValue không tồn tại');
    if (value.attributeId !== attributeId) {
      throw new BadRequestException('AttributeValue không thuộc attribute này');
    }

    await this.prisma.attributeValue.delete({ where: { id: valueId } });
    return { message: 'Đã xoá attribute value' };
  }

  // ---------------------------
  // Helpers
  // ---------------------------
  private async ensureAttributeExists(id: string) {
    const attribute = await this.prisma.attribute.findUnique({ where: { id } });
    if (!attribute) throw new NotFoundException('Attribute không tồn tại');
  }
}
