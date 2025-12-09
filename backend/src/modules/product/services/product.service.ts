import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto, PaginationService, type PaginatedResult } from 'src/common/pagination';
import { slugify } from 'src/common/utils/string.helper';
import type { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from '../dto/create-product.dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

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
  async createProduct(dto: CreateProductDto) {
    // 1. Lấy tên để tạo slug
    const mainName = dto.name.vi || dto.name.en || Object.values(dto.name)[0];
    if (!mainName) {
      throw new BadRequestException('Tên sản phẩm phải có ít nhất một ngôn ngữ');
    }

    // 2. Tạo slug unique
    const finalSlug = await this.generateUniqueSlug(dto.slug || slugify(mainName));

    // 3. Validate categoryIds
    if (dto.categoryIds?.length) {
      await this.validateCategories(dto.categoryIds);
    }

    // 4. Tạo product
    return await this.prisma.product.create({
      data: {
        name: dto.name,
        slug: finalSlug,
        description: dto.description ?? undefined,
        hasVariants: dto.hasVariants ?? true,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,

        categories: dto.categoryIds?.length
          ? {
              // Dùng 'create' để tạo mới ProductCategory records
              // (không dùng 'connect' vì ProductCategory chưa tồn tại khi tạo Product mới)
              create: dto.categoryIds.map((categoryId) => ({
                categoryId,
              })),
            }
          : undefined,
      },
      include: {
        categories: { include: { category: true } },
      },
    });
  }

  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    const slug = baseSlug;

    const exists = await this.prisma.product.findUnique({ where: { slug } });
    if (!exists) return slug;

    let counter = 1;
    while (await this.prisma.product.findUnique({ where: { slug: `${baseSlug}-${counter}` } })) {
      counter++;
    }

    return `${baseSlug}-${counter}`;
  }

  private async validateCategories(categoryIds: string[]) {
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds }, isActive: true },
    });

    if (categories.length !== categoryIds.length) {
      throw new BadRequestException('Một hoặc nhiều danh mục không tồn tại hoặc không active');
    }
  }
}
