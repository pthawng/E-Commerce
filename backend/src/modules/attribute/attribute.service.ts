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

  /**
   * Retrieves all attributes with their values.
   */
  findAll() {
    return this.prisma.attribute.findMany({
      include: { values: { orderBy: { order: 'asc' } } },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Retrieves a single attribute by ID.
   */
  async findOne(id: string) {
    const attribute = await this.prisma.attribute.findUnique({
      where: { id },
      include: { values: { orderBy: { order: 'asc' } } },
    });
    if (!attribute) throw new NotFoundException('Attribute does not exist');
    return attribute;
  }

  /**
   * Creates a new attribute.
   */
  async create(dto: CreateAttributeDto) {
    // Check for unique attribute code
    const exist = await this.prisma.attribute.findUnique({ where: { code: dto.code } });
    if (exist) throw new BadRequestException('Attribute code already exists');

    // Create attribute and optional values in a transaction
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

  /**
   * Updates an existing attribute.
   */
  async update(id: string, dto: UpdateAttributeDto) {
    return this.prisma.$transaction(async (tx) => {
      const attribute = await tx.attribute.findUnique({ where: { id } });
      if (!attribute) throw new NotFoundException('Attribute does not exist');

      if (dto.code && dto.code !== attribute.code) {
        const exist = await tx.attribute.findUnique({ where: { code: dto.code } });
        if (exist) throw new BadRequestException('Attribute code already exists');
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

  /**
   * Deletes an attribute and its associated values.
   */
  async remove(id: string) {
    await this.ensureAttributeExists(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.attributeValue.deleteMany({ where: { attributeId: id } });
      await tx.attribute.delete({ where: { id } });
    });
    return { message: 'Attribute deleted successfully' };
  }

  /**
   * Retrieves all attribute values, optionally filtered by search query.
   */
  async listAllValues(search?: string) {
    const where: any = {};

    // Search within metaValue field
    if (search) {
      where.OR = [
        { metaValue: { contains: search, mode: 'insensitive' } },
        // Note: Prisma does not support searching directly within JSON fields.
        // Consider using raw queries or full-text search if needed.
      ];
    }

    return this.prisma.attributeValue.findMany({
      where,
      include: {
        attribute: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: [{ attribute: { code: 'asc' } }, { order: 'asc' }],
    });
  }

  /**
   * Retrieves all values for a specific attribute.
   */
  async listValues(attributeId: string) {
    await this.ensureAttributeExists(attributeId);
    return this.prisma.attributeValue.findMany({
      where: { attributeId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Creates a new value for an attribute.
   */
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

  /**
   * Updates an existing attribute value.
   */
  async updateValue(attributeId: string, valueId: string, dto: UpdateAttributeValueDto) {
    const value = await this.prisma.attributeValue.findUnique({ where: { id: valueId } });
    if (!value) throw new NotFoundException('Attribute value does not exist');
    if (value.attributeId !== attributeId) {
      throw new BadRequestException('Attribute value does not belong to this attribute');
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

  /**
   * Deletes an attribute value.
   */
  async removeValue(attributeId: string, valueId: string) {
    const value = await this.prisma.attributeValue.findUnique({ where: { id: valueId } });
    if (!value) throw new NotFoundException('Attribute value does not exist');
    if (value.attributeId !== attributeId) {
      throw new BadRequestException('Attribute value does not belong to this attribute');
    }

    await this.prisma.attributeValue.delete({ where: { id: valueId } });
    return { message: 'Attribute value deleted successfully' };
  }

  private async ensureAttributeExists(id: string) {
    const attribute = await this.prisma.attribute.findUnique({ where: { id } });
    if (!attribute) throw new NotFoundException('Attribute does not exist');
  }

  private async syncValuesTx(
    tx: PrismaService,
    attributeId: string,
    values: AttributeValueUpsertDto[],
  ) {
    // Strategy: only add or update the provided items; do not delete missing ones
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
