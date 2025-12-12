import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVariantDto } from '../dto/variant/create-variant.dto';
import { UpdateVariantDto } from '../dto/variant/update-variant.dto';

export type VariantWithRelations = Prisma.ProductVariantGetPayload<{
  include: {
    attributes: {
      include: {
        attributeValue: {
          include: {
            attribute: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class VariantService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------
  // CREATE VARIANT
  // ---------------------------
  async createVariant(productId: string, dto: CreateVariantDto) {
    // Ensure product exists
    await this.ensureProductExists(productId);

    // Ensure SKU unique
    if (dto.sku) {
      const exists = await this.prisma.productVariant.findUnique({ where: { sku: dto.sku } });
      if (exists) {
        throw new BadRequestException('SKU đã tồn tại');
      }
    }

    // If creating first variant, set isDefault = true
    const variantCount = await this.prisma.productVariant.count({
      where: { productId, deletedAt: null },
    });
    const shouldBeDefault = variantCount === 0;

    const variant = await this.prisma.productVariant.create({
      data: {
        sku: dto.sku,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
        costPrice: dto.costPrice,
        weightGram: dto.weightGram,
        variantTitle: dto.variantTitle as Prisma.InputJsonValue,
        position: dto.position ?? 0,
        isActive: dto.isActive ?? true,
        product: { connect: { id: productId } },
        isDefault: dto.isDefault ?? shouldBeDefault,
      },
    });

    // If mark as default, unset others
    if (variant.isDefault) {
      await this.unsetOtherDefaults(productId, variant.id);
    }

    await this.recalculateDisplayPrice(productId);
    return variant;
  }

  // ---------------------------
  // UPDATE VARIANT
  // ---------------------------
  async updateVariant(productId: string, variantId: string, dto: UpdateVariantDto) {
    const existing = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!existing) {
      throw new NotFoundException('Variant không tồn tại');
    }

    if (existing.productId !== productId) {
      throw new BadRequestException('Variant không thuộc sản phẩm này');
    }

    // SKU unique check
    if (dto.sku && typeof dto.sku === 'string') {
      const exists = await this.prisma.productVariant.findUnique({ where: { sku: dto.sku } });
      if (exists && exists.id !== variantId) {
        throw new BadRequestException('SKU đã tồn tại');
      }
    }

    const data: Prisma.ProductVariantUpdateInput = this.pickDefined({
      sku: dto.sku,
      price: dto.price,
      compareAtPrice: dto.compareAtPrice,
      costPrice: dto.costPrice,
      weightGram: dto.weightGram,
      variantTitle: dto.variantTitle as Prisma.InputJsonValue | undefined,
      isDefault: dto.isDefault,
      isActive: dto.isActive,
      position: dto.position,
    });

    const updated = await this.prisma.productVariant.update({
      where: { id: variantId },
      data,
    });

    if (data.isDefault === true) {
      await this.unsetOtherDefaults(updated.productId, variantId);
    }

    await this.recalculateDisplayPrice(updated.productId);
    return updated;
  }

  // ---------------------------
  // DELETE VARIANT
  // ---------------------------
  async deleteVariant(productId: string, variantId: string) {
    const existing = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!existing) {
      throw new NotFoundException('Variant không tồn tại');
    }
    if (existing.productId !== productId) {
      throw new BadRequestException('Variant không thuộc sản phẩm này');
    }

    await this.prisma.productVariant.delete({ where: { id: variantId } });
    await this.recalculateDisplayPrice(existing.productId);

    return { message: 'Đã xoá variant', id: variantId };
  }

  // ---------------------------
  // GET VARIANT BY ID
  // ---------------------------
  async findOne(productId: string, variantId: string): Promise<VariantWithRelations> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        attributes: {
          include: {
            attributeValue: {
              include: { attribute: true },
            },
          },
        },
      },
    });

    if (!variant) {
      throw new NotFoundException('Variant không tồn tại');
    }
    if (variant.productId !== productId) {
      throw new BadRequestException('Variant không thuộc sản phẩm này');
    }

    return variant;
  }

  // ---------------------------
  // GET VARIANTS BY PRODUCT
  // ---------------------------
  async findByProduct(productId: string) {
    await this.ensureProductExists(productId);
    return this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // ---------------------------
  // Helpers
  // ---------------------------
  private async ensureProductExists(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new BadRequestException('Product không tồn tại');
    }
  }

  private async unsetOtherDefaults(productId: string, variantId: string) {
    await this.prisma.productVariant.updateMany({
      where: { productId, NOT: { id: variantId } },
      data: { isDefault: false },
    });
  }

  private async recalculateDisplayPrice(productId: string) {
    // Lấy min/max price của các variant đang active và chưa xoá
    const prices = await this.prisma.productVariant.findMany({
      where: { productId, deletedAt: null, isActive: true },
      select: { price: true },
    });

    if (!prices.length) {
      await this.prisma.product.update({
        where: { id: productId },
        data: {
          displayPriceMin: null,
          displayPriceMax: null,
        },
      });
      return;
    }

    const nums = prices.map((p) => Number(p.price));
    const min = Math.min(...nums);
    const max = Math.max(...nums);

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        displayPriceMin: min,
        displayPriceMax: max,
      },
    });
  }

  private pickDefined<T extends Record<string, any>>(obj: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined),
    ) as Partial<T>;
  }
}
