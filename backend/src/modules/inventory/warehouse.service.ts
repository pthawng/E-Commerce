import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.warehouse.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${id} not found`);
    }
    return warehouse;
  }

  async create(dto: CreateWarehouseDto) {
    const existing = await this.prisma.warehouse.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestException(`Warehouse code "${dto.code}" already exists`);
    }

    return this.prisma.warehouse.create({
      data: {
        name: dto.name,
        code: dto.code,
        address: dto.address ?? undefined,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateWarehouseDto) {
    await this.findOne(id); // ensure exists

    if (dto.code) {
      const existing = await this.prisma.warehouse.findUnique({
        where: { code: dto.code },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Warehouse code "${dto.code}" already exists`);
      }
    }

    return this.prisma.warehouse.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }
}
