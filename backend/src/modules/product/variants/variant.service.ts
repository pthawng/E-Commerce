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
  async createVariant(
    productId: string,
    dto: CreateVariantDto,
    tx?: Prisma.TransactionClient,
    options?: {
      mediaRecords?: Array<{ id: string; order: number }>;
      skipRecalc?: boolean;
      autoAssignDefault?: boolean;
    },
  ) {
    const client = tx ?? this.prisma;

    // Ensure product exists
    const product = await this.ensureProductExists(productId, client);

    // Ensure SKU unique / auto-gen
    const rawSku = dto.sku?.trim();
    // If creating first variant, set isDefault = true (opt-in)
    const variantCount = await client.productVariant.count({
      where: { productId, deletedAt: null },
    });

    const finalSku = rawSku || this.generateSku(product.slug, dto.variantTitle, variantCount + 1);

    const exists = await client.productVariant.findUnique({ where: { sku: finalSku } });
    if (exists) {
      throw new BadRequestException('SKU đã tồn tại');
    }

    const shouldBeDefault =
      options?.autoAssignDefault === undefined || options.autoAssignDefault
        ? variantCount === 0
        : false;

    // Validate attribute values nếu có
    if (dto.attributeValueIds?.length) {
      await this.validateAttributeValues(dto.attributeValueIds, client);
    }

    const variant = await client.productVariant.create({
      data: {
        sku: finalSku,
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
      await this.unsetOtherDefaults(productId, variant.id, client);
    }

    // Attribute values
    if (dto.attributeValueIds?.length) {
      await client.variantAttributeValue.createMany({
        data: dto.attributeValueIds.map((attributeValueId) => ({
          variantId: variant.id,
          attributeValueId,
        })),
        skipDuplicates: true,
      });
    }

    // Map media via index
    if (dto.mediaIndexes?.length) {
      let medias = options?.mediaRecords;
      if (!medias) {
        const dbMedias = await client.productMedia.findMany({
          where: { productId },
          orderBy: { order: 'asc' },
          select: { id: true, order: true },
        });
        medias = dbMedias;
      }

      const connectIds = dto.mediaIndexes.map((idx) => {
        const media = medias?.[idx];
        if (!media) {
          throw new BadRequestException(`mediaIndex ${idx} không hợp lệ`);
        }
        return { id: media.id };
      });

      if (connectIds.length) {
        await client.productVariant.update({
          where: { id: variant.id },
          data: {
            media: {
              connect: connectIds,
            },
          },
        });
      }
    }

    if (!options?.skipRecalc) {
      await this.recalculateDisplayPrice(productId, client);
    }
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
  private async ensureProductExists(
    productId: string,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const product = await client.product.findUnique({
      where: { id: productId },
      select: { id: true, slug: true },
    });
    if (!product) {
      throw new BadRequestException('Product không tồn tại');
    }
    return product;
  }

  private async unsetOtherDefaults(
    productId: string,
    variantId: string,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    await client.productVariant.updateMany({
      where: { productId, NOT: { id: variantId } },
      data: { isDefault: false },
    });
  }

  async recalculateDisplayPrice(
    productId: string,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    // Lấy min/max price của các variant đang active và chưa xoá
    const prices = await client.productVariant.findMany({
      where: { productId, deletedAt: null, isActive: true },
      select: { price: true },
    });

    if (!prices.length) {
      await client.product.update({
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

    await client.product.update({
      where: { id: productId },
      data: {
        displayPriceMin: min,
        displayPriceMax: max,
      },
    });
  }

  private async validateAttributeValues(
    attributeValueIds: string[],
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const uniqueIds = Array.from(new Set(attributeValueIds));
    const found = await client.attributeValue.count({
      where: { id: { in: uniqueIds } },
    });
    if (found !== uniqueIds.length) {
      throw new BadRequestException('Một hoặc nhiều attributeValueId không tồn tại');
    }
  }

  private generateSku(baseSlug: string, variantTitle: any, seq: number) {
    const parts = [baseSlug];
    if (variantTitle && typeof variantTitle === 'object') {
      const values = Object.values(variantTitle)
        .map((v) => (typeof v === 'string' ? v : ''))
        .filter(Boolean)
        .map((v) => v.replace(/\s+/g, '').toUpperCase());
      if (values.length) {
        parts.push(...values);
      }
    }
    parts.push(String(seq).padStart(2, '0'));
    return parts.join('-').toUpperCase();
  }

  private pickDefined<T extends Record<string, any>>(obj: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined),
    ) as Partial<T>;
  }
}
