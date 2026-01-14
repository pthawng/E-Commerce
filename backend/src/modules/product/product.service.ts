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
    // 1. Initial Validation & Defaults
    const hasVariants = dto.hasVariants ?? false;
    this.validateProductBasics(dto, hasVariants);

    // 2. Prepare Data
    const baseSlug = dto.slug ? slugify(dto.slug) : slugify(this.getMainName(dto) || '');
    const mediaUrlPayload = dto.mediaUrls || [];

    // 3. Execution
    return this.prisma.$transaction(async (tx) => {
      // 3.1 Uniqueness & Existence Checks
      const finalSlug = await this.generateUniqueSlug(baseSlug, tx);
      await this.validateRelations(dto, tx);

      // 3.2 Create Parent Product
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

      // 3.3 Link Categories
      if (dto.categoryIds?.length) {
        await tx.productCategory.createMany({
          data: dto.categoryIds.map((categoryId) => ({
            productId: product.id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }

      // 3.4 Process Media
      const mediaRecords = await this.processMediaCreation(product.id, mediaUrlPayload, files, tx);

      // 3.5 Process Variants
      await this.processVariantCreation(product.id, dto, hasVariants, finalSlug, mediaRecords, tx);

      // 3.6 Recalculate Prices
      await this.variantService.recalculateDisplayPrice(product.id, tx);

      // 3.7 Return Result
      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        include: {
          variants: {
            where: { deletedAt: null },
            include: {
              attributes: { include: { attributeValue: { include: { attribute: true } } } },
              media: true,
            },
            orderBy: { position: 'asc' },
          },
          media: { orderBy: { order: 'asc' } },
          categories: { include: { category: true } },
        },
      });
    });
  }

  // ==================== PRIVATE HELPERS: CREATE ==================== //

  private validateProductBasics(dto: CreateProductDto, hasVariants: boolean) {
    const mainName = this.getMainName(dto);
    if (!mainName) {
      throw new BadRequestException('Tên sản phẩm phải có ít nhất một ngôn ngữ');
    }

    if (!hasVariants && !dto.basePrice && dto.isActive !== false) {
      throw new BadRequestException(
        'Simple products require basePrice when active. Set isActive = false to create a draft.',
      );
    }
    if (hasVariants && (!dto.variants || dto.variants.length === 0)) {
      throw new BadRequestException('Cần ít nhất 1 variant khi hasVariants = true');
    }
  }

  private getMainName(dto: CreateProductDto | UpdateProductDto) {
    return dto.name?.vi || dto.name?.en || (dto.name ? Object.values(dto.name)[0] : undefined);
  }

  private async validateRelations(
    dto: CreateProductDto,
    tx: Prisma.TransactionClient,
  ) {
    if (dto.categoryIds?.length) {
      await this.validateCategories(dto.categoryIds, tx);
    }

    const allAttributeValueIds =
      dto.variants?.flatMap((v) => v.attributeValueIds || [])?.filter(Boolean) || [];

    if (allAttributeValueIds.length) {
      await this.validateAttributeValues(allAttributeValueIds, tx);
    }
  }

  private async processMediaCreation(
    productId: string,
    mediaUrls: string[],
    files: Express.Multer.File[] | undefined,
    tx: Prisma.TransactionClient,
  ) {
    const mediaRecords: Array<{ id: string; order: number }> = [];
    let currentOrder = 0;

    // A. URL Media
    for (const url of mediaUrls) {
      const media = await tx.productMedia.create({
        data: {
          productId,
          url,
          type: 'image',
          isThumbnail: currentOrder === 0,
          order: currentOrder,
        },
      });
      mediaRecords.push({ id: media.id, order: media.order });
      currentOrder++;
    }

    // B. File Media
    if (files?.length) {
      for (const file of files) {
        const media = await this.productStorageService.uploadMedia(
          productId,
          file,
          {
            isThumbnail: currentOrder === 0,
            order: currentOrder,
          },
          tx,
        );
        mediaRecords.push({ id: media.id, order: media.order });
        currentOrder++;
      }
    }

    return mediaRecords;
  }

  private async processVariantCreation(
    productId: string,
    dto: CreateProductDto,
    hasVariants: boolean,
    slug: string,
    mediaRecords: Array<{ id: string; order: number }>,
    tx: Prisma.TransactionClient,
  ) {
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
    const skuSet = new Set<string>();

    for (const [index, v] of variantsInput.entries()) {
      let finalSku = v.sku;
      if (!finalSku || !finalSku.trim()) {
        finalSku = this.generateSku(slug, v.variantTitle, index + 1);
      }
      if (skuSet.has(finalSku)) {
        throw new BadRequestException(`SKU bị trùng trong payload: ${finalSku}`);
      }
      skuSet.add(finalSku);

      await this.variantService.createVariant(
        productId,
        {
          productId,
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
  }

  // ==================== PRIVATE HELPERS: UTILS ==================== //

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
  // ---------------------------
  // UPDATE PRODUCT
  // ---------------------------
  async updateProduct(id: string, dto: UpdateProductDto, files?: Express.Multer.File[]) {
    // 1. Check Existence
    const existing = await this.getProductOrThrow(id);

    // 2. Prepare Data
    const finalSlug = await this.resolveUpdatedSlug(existing, dto);
    const categoryConnection = await this.resolveUpdatedCategories(dto);

    // 3. Update Product
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name ? (dto.name as Prisma.InputJsonValue) : undefined,
        description: dto.description ? (dto.description as Prisma.InputJsonValue) : undefined,
        slug: finalSlug,
        hasVariants: dto.hasVariants ?? undefined,
        isActive: dto.isActive ?? undefined,
        isFeatured: dto.isFeatured ?? undefined,
        categories: categoryConnection,
      },
      include: {
        categories: { include: { category: true } },
        media: true,
      },
    });

    // 4. Handle New Files
    if (files && files.length > 0) {
      await this.handlePostUpdateMedia(id, files);
    }

    return updated;
  }

  // ==================== PRIVATE HELPERS: UPDATE ==================== //

  private async getProductOrThrow(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sản phẩm không tồn tại');
    return existing;
  }

  private async resolveUpdatedSlug(existing: { id: string; slug: string }, dto: UpdateProductDto) {
    let finalSlug = existing.slug;

    // Determine target slug base
    if (dto.slug) {
      finalSlug = slugify(dto.slug);
    } else if (dto.name) {
      // Auto-generate from new name if slug not provided but name changed
      const mainName = dto.name.vi || dto.name.en || Object.values(dto.name)[0];
      finalSlug = slugify(mainName);
    }

    // If slug hasn't changed effectively, return early
    if (finalSlug === existing.slug) return existing.slug;

    // Ensure uniqueness if changed
    const slugExists = await this.prisma.product.findUnique({ where: { slug: finalSlug } });

    // If conflict found (and it's not the same product), append counter
    if (slugExists && slugExists.id !== existing.id) {
      return this.generateUniqueSlug(finalSlug);
    }

    return finalSlug;
  }

  private async resolveUpdatedCategories(dto: UpdateProductDto) {
    if (!dto.categoryIds) return undefined;

    await this.validateCategories(dto.categoryIds);

    return {
      set: [], // Clear old relations
      create: dto.categoryIds.map((categoryId) => ({
        categoryId,
      })),
    };
  }

  private async handlePostUpdateMedia(productId: string, files: Express.Multer.File[]) {
    const maxOrder = await this.prisma.productMedia.findFirst({
      where: { productId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const startOrder = maxOrder ? maxOrder.order + 1 : 0;

    const uploadPromises = files.map((file, index) =>
      this.productStorageService.uploadMedia(productId, file, {
        isThumbnail: false,
        order: startOrder + index,
      })
    );

    await Promise.all(uploadPromises);
  }
}
