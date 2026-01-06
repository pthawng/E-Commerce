import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto, PaginationService, type PaginatedResult } from 'src/common/pagination';
import { slugify } from 'src/common/utils/string.helper';
import type { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto, CreateProductVariantInputDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStorageService } from './product.storage/product-storage.service';
import { VariantService } from './variants/variant.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly productStorageService: ProductStorageService,
    private readonly variantService: VariantService,
  ) { }

  // ---------------------------
  // GET ALL PRODUCTS (PAGINATED)
  // ---------------------------
  async findAllPaginated(dto: PaginationDto): Promise<PaginatedResult<any>> {
    type PrismaProduct = Prisma.ProductGetPayload<{
      include: {
        variants: true;
        media: true;
        categories: { include: { category: true } };
      };
    }>;
    type ProductWhereInput = Prisma.ProductWhereInput;

    const baseWhere: ProductWhereInput = { deletedAt: null };

    const result = await this.paginationService.paginate<PrismaProduct>({
      findMany: (args) => {
        const where: ProductWhereInput = args.where ? { ...baseWhere, ...args.where } : baseWhere;

        return this.prisma.product.findMany({
          where,
          include: {
            variants: {
              where: { deletedAt: null, isActive: true },
              orderBy: { position: 'asc' },
            },
            media: {
              orderBy: { order: 'asc' },
            },
            categories: {
              include: {
                category: true,
              },
            },
          },
          orderBy: args.orderBy as Prisma.ProductOrderByWithRelationInput,
          skip: args.skip,
          take: args.take,
        });
      },
      count: (args) => {
        const where: ProductWhereInput = args.where ? { ...baseWhere, ...args.where } : baseWhere;
        return this.prisma.product.count({ where });
      },
      dto,
      where: baseWhere,
      allowedSortFields: ['createdAt', 'updatedAt', 'displayPriceMin', 'displayPriceMax'],
      defaultSort: { field: 'createdAt', order: 'desc' },
      basePath: '/products',
    });

    return result;
  }

  // ---------------------------
  // GET ONE PRODUCT
  // ---------------------------
  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        variants: {
          where: { deletedAt: null },
          include: {
            attributes: {
              include: {
                attributeValue: {
                  include: {
                    attribute: true,
                  },
                },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        media: {
          orderBy: { order: 'asc' },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // ---------------------------
  // GET PRODUCT BY SLUG
  // ---------------------------
  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null, isActive: true },
      include: {
        variants: {
          where: { deletedAt: null, isActive: true },
          include: {
            attributes: {
              include: {
                attributeValue: {
                  include: {
                    attribute: true,
                  },
                },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        media: {
          orderBy: { order: 'asc' },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // ---------------------------
  // CREATE PRODUCT
  // ---------------------------
  async createProduct(dto: CreateProductDto, files?: Express.Multer.File[]) {
    // Default to simple product (no variants) if hasVariants is not provided
    const hasVariants = dto.hasVariants ?? false;

    const mainName =
      dto.name?.vi || dto.name?.en || (dto.name ? Object.values(dto.name)[0] : undefined);
    if (!mainName) {
      throw new BadRequestException('Tên sản phẩm phải có ít nhất một ngôn ngữ');
    }

    // Rule: if no variants, basePrice is required for active products.
    // Allow creating drafts (isActive = false) without price.
    if (!hasVariants && !dto.basePrice && dto.isActive !== false) {
      throw new BadRequestException(
        'Simple products require basePrice when active. Set isActive = false to create a draft.',
      );
    }
    if (hasVariants && (!dto.variants || dto.variants.length === 0)) {
      throw new BadRequestException('Cần ít nhất 1 variant khi hasVariants = true');
    }

    // Collect attributeValueIds for validation
    const allAttributeValueIds =
      dto.variants?.flatMap((v) => v.attributeValueIds || [])?.filter(Boolean) || [];

    // Gom mediaUrl order base
    const mediaUrlPayload = dto.mediaUrls || [];

    const baseSlug = dto.slug ? slugify(dto.slug) : slugify(mainName);

    return this.prisma.$transaction(async (tx) => {
      // 1. Ensure unique slug
      const finalSlug = await this.generateUniqueSlug(baseSlug, tx);

      // 2. Validate categoryIds
      if (dto.categoryIds?.length) {
        await this.validateCategories(dto.categoryIds, tx);
      }

      // 3. Validate attributeValueIds (nếu có)
      if (allAttributeValueIds.length) {
        await this.validateAttributeValues(allAttributeValueIds, tx);
      }

      // 4. Create parent product
      const product = await tx.product.create({
        data: {
          name: dto.name,
          slug: finalSlug,
          description: dto.description ?? undefined,
          hasVariants,
          isActive: dto.isActive ?? true,
          isFeatured: dto.isFeatured ?? false,
        },
      });

      // 5. Categories
      if (dto.categoryIds?.length) {
        await tx.productCategory.createMany({
          data: dto.categoryIds.map((categoryId) => ({
            productId: product.id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }

      // 6. Process Media (URLs first)
      const mediaRecords: Array<{ id: string; order: number }> = [];
      if (mediaUrlPayload.length) {
        for (const [index, url] of mediaUrlPayload.entries()) {
          const media = await tx.productMedia.create({
            data: {
              productId: product.id,
              url,
              type: 'image',
              isThumbnail: index === 0,
              order: index,
            },
          });
          mediaRecords.push({ id: media.id, order: media.order });
        }
      }

      // 7. Process Media (File uploads) - Record in DB within tx; upload to storage
      if (files?.length) {
        const startOrder = mediaRecords.length;
        for (const [index, file] of files.entries()) {
          const media = await this.productStorageService.uploadMedia(
            product.id,
            file,
            {
              isThumbnail: mediaRecords.length === 0 && index === 0,
              order: startOrder + index,
            },
            tx,
          );
          mediaRecords.push({ id: media.id, order: media.order });
        }
      }

      // 8. Variants
      type VariantInput = CreateProductVariantInputDto & {
        mediaIndexes?: number[];
        attributeValueIds?: string[];
      };

      const variantsInput: VariantInput[] = hasVariants
        ? (dto.variants as VariantInput[]) || []
        : [
          {
            sku: undefined,
            price: dto.basePrice!,
            compareAtPrice: dto.baseCompareAtPrice,
            costPrice: dto.baseCostPrice,
            weightGram: dto.baseWeightGram,
            variantTitle: dto.baseVariantTitle ?? { default: 'Default Variant' },
            isDefault: true,
            isActive: dto.isActive ?? true,
            position: 0,
            attributeValueIds: [],
            mediaIndexes: [],
          },
        ];

      const defaultIndexExplicit = variantsInput.findIndex((v) => v.isDefault);
      const defaultIndex = defaultIndexExplicit >= 0 ? defaultIndexExplicit : 0;

      // Prevent duplicate SKUs in payload
      const skuSet = new Set<string>();

      for (const [index, v] of variantsInput.entries()) {
        let finalSku = v.sku;
        if (!finalSku || !finalSku.trim()) {
          finalSku = this.generateSku(finalSlug, v.variantTitle, index + 1);
        }
        if (skuSet.has(finalSku)) {
          throw new BadRequestException(`SKU bị trùng trong payload: ${finalSku}`);
        }
        skuSet.add(finalSku);

        await this.variantService.createVariant(
          product.id,
          {
            productId: product.id,
            ...v,
            sku: finalSku,
            isDefault: index === defaultIndex,
            position: v.position ?? index,
          },
          tx,
          {
            mediaRecords,
            skipRecalc: true,
          },
        );
      }

      // 9. Recalculate min/max price trong tx
      await this.variantService.recalculateDisplayPrice(product.id, tx);

      // 10. Return full product with relations
      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        include: {
          variants: {
            where: { deletedAt: null },
            include: {
              attributes: {
                include: {
                  attributeValue: {
                    include: { attribute: true },
                  },
                },
              },
              media: true,
            },
            orderBy: { position: 'asc' },
          },
          media: {
            orderBy: { order: 'asc' },
          },
          categories: {
            include: { category: true },
          },
        },
      });
    });
  }

  /**
   * Upload nhiều ảnh cho product
   * Ảnh đầu tiên sẽ tự động được set làm thumbnail
   */
  private async uploadMultipleImages(productId: string, files: Express.Multer.File[]) {
    const uploadPromises = files.map(async (file, index) => {
      return this.productStorageService.uploadMedia(
        productId,
        file,
        {
          isThumbnail: index === 0, // Ảnh đầu tiên làm thumbnail
          order: index,
        },
        this.prisma,
      );
    });

    await Promise.all(uploadPromises);
  }

  private async generateUniqueSlug(
    baseSlug: string,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<string> {
    const exists = await client.product.findUnique({ where: { slug: baseSlug } });
    if (!exists) return baseSlug;

    let counter = 1;
    let candidate = `${baseSlug}-${counter}`;
    while (await client.product.findUnique({ where: { slug: candidate } })) {
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }
    return candidate;
  }

  private async validateCategories(
    categoryIds: string[],
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const categories = await client.category.findMany({
      where: { id: { in: categoryIds }, isActive: true },
    });

    if (categories.length !== categoryIds.length) {
      throw new BadRequestException('Một hoặc nhiều danh mục không tồn tại hoặc không active');
    }
  }

  private async validateAttributeValues(
    attributeValueIds: string[],
    client: Prisma.TransactionClient | PrismaService,
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

  // ---------------------------
  // UPDATE PRODUCT
  // ---------------------------
  async updateProduct(id: string, dto: UpdateProductDto, files?: Express.Multer.File[]) {
    // Bước 1: Kiểm tra product có tồn tại không
    const existing = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Bước 2: Xử lý slug nếu người dùng thay đổi tên hoặc slug
    let finalSlug = existing.slug;

    // Nếu user gửi slug → ưu tiên dùng slug đó
    if (dto.slug) {
      finalSlug = slugify(dto.slug);
    }
    // Nếu user không gửi slug nhưng gửi update tên → tự tạo slug từ tên
    else if (dto.name) {
      const mainName = dto.name.vi || dto.name.en || Object.values(dto.name)[0];

      finalSlug = slugify(mainName);
    }

    // Bước 3: Check slug unique (trừ chính nó)
    if (finalSlug !== existing.slug) {
      const slugExists = await this.prisma.product.findUnique({
        where: { slug: finalSlug },
      });

      if (slugExists && slugExists.id !== id) {
        // Nếu slug trùng → thêm số vào cuối
        let counter = 1;
        let newSlug = `${finalSlug}-${counter}`;

        while (
          await this.prisma.product.findUnique({
            where: { slug: newSlug },
          })
        ) {
          counter++;
          newSlug = `${finalSlug}-${counter}`;
        }

        finalSlug = newSlug;
      }
    }

    // Bước 4: Validate categoryIds nếu người dùng cập nhật categories
    let categoryConnection: any = undefined;

    if (dto.categoryIds) {
      const categories = await this.prisma.category.findMany({
        where: {
          id: { in: dto.categoryIds },
          isActive: true,
        },
      });

      if (categories.length !== dto.categoryIds.length) {
        throw new BadRequestException('Một hoặc nhiều danh mục không tồn tại hoặc không active');
      }

      // Clear hết categories cũ rồi set categories mới
      categoryConnection = {
        set: [], // Xoá tất cả trước
        create: dto.categoryIds.map((categoryId) => ({
          categoryId,
        })),
      };
    }

    // Bước 5: Update sản phẩm
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        // Chỉ set field nếu user cung cấp
        name: dto.name ? (dto.name as Prisma.InputJsonValue) : undefined,
        description: dto.description ? (dto.description as Prisma.InputJsonValue) : undefined,
        slug: finalSlug,
        hasVariants: dto.hasVariants ?? undefined,
        isActive: dto.isActive ?? undefined,
        isFeatured: dto.isFeatured ?? undefined,
        categories: categoryConnection,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        media: true,
      },
    });

    // Bước 6: Upload ảnh mới nếu có
    if (files && files.length > 0) {
      // Lấy order hiện tại để tiếp tục
      const maxOrder = await this.prisma.productMedia.findFirst({
        where: { productId: id },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      const startOrder = maxOrder ? maxOrder.order + 1 : 0;

      const uploadPromises = files.map(async (file, index) => {
        return this.productStorageService.uploadMedia(id, file, {
          isThumbnail: false, // Không tự động set thumbnail khi update
          order: startOrder + index,
        });
      });

      await Promise.all(uploadPromises);
    }

    return updated;
  }
}
