import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { AttributeValueUpsertDto } from './dto/upsert-attribute-value.dto';

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

    // Transaction: create attribute + optional values
    return this.prisma.$transaction(async (tx) => {
      const attribute = await tx.attribute.create({
        data: {
          code: dto.code,
          name: dto.name as any,
          filterType: dto.filterType,
        },
      });

      if (dto.values?.length) {
        const valuesToCreate = dto.values.map((v, idx) => ({
          attributeId: attribute.id,
          value: v.value as any,
          metaValue: v.metaValue,
          order: v.order ?? idx,
        }));
        await tx.attributeValue.createMany({ data: valuesToCreate });
      }

      const values = await tx.attributeValue.findMany({
        where: { attributeId: attribute.id },
        orderBy: { order: 'asc' },
      });

      return { ...attribute, values };
    });
  }

  async update(id: string, dto: UpdateAttributeDto) {
    return this.prisma.$transaction(async (tx) => {
      const attribute = await tx.attribute.findUnique({ where: { id } });
      if (!attribute) throw new NotFoundException('Attribute không tồn tại');

      if (dto.code && dto.code !== attribute.code) {
        const exist = await tx.attribute.findUnique({ where: { code: dto.code } });
        if (exist) throw new BadRequestException('Mã attribute đã tồn tại');
      }

      const updated = await tx.attribute.update({
        where: { id },
        data: {
          code: dto.code ?? attribute.code,
          name: (dto.name as any) ?? attribute.name,
          filterType: dto.filterType ?? attribute.filterType,
        },
      });

      if (dto.values) {
        await this.syncValuesTx(tx as PrismaService, id, dto.values);
      }

      const values = await tx.attributeValue.findMany({
        where: { attributeId: id },
        orderBy: { order: 'asc' },
      });

      return { ...updated, values };
    });
  }

  async remove(id: string) {
    await this.ensureAttributeExists(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.attributeValue.deleteMany({ where: { attributeId: id } });
      await tx.attribute.delete({ where: { id } });
    });
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

  private async syncValuesTx(
    tx: PrismaService,
    attributeId: string,
    values: AttributeValueUpsertDto[],
  ) {
    // Strategy: only add/update the provided items; do NOT delete missing ones.
    for (const [index, v] of values.entries()) {
      if (v.id) {
        await tx.attributeValue.update({
          where: { id: v.id },
          data: {
            value: (v.value as any) ?? undefined,
            metaValue: v.metaValue ?? undefined,
            order: v.order ?? index,
          },
        });
      } else {
        await tx.attributeValue.create({
          data: {
            attributeId,
            value: v.value as any,
            metaValue: v.metaValue,
            order: v.order ?? index,
          },
        });
      }
    }
  }
}
