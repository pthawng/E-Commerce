import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto, PaginationService, type PaginatedResult } from 'src/common/pagination';
import { slugify } from 'src/common/utils/string.helper';
import type { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStorageService } from './product.storage/product-storage.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly productStorageService: ProductStorageService,
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
  async createProduct(dto: CreateProductDto, files?: Express.Multer.File[]) {
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
    const product = await this.prisma.product.create({
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
        media: true,
      },
    });

    // 5. Upload ảnh nếu có
    if (files && files.length > 0) {
      await this.uploadMultipleImages(product.id, files);
    }

    return product;
  }

  /**
   * Upload nhiều ảnh cho product
   * Ảnh đầu tiên sẽ tự động được set làm thumbnail
   */
  private async uploadMultipleImages(productId: string, files: Express.Multer.File[]) {
    const uploadPromises = files.map(async (file, index) => {
      return this.productStorageService.uploadMedia(productId, file, {
        isThumbnail: index === 0, // Ảnh đầu tiên làm thumbnail
        order: index,
      });
    });

    await Promise.all(uploadPromises);
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
