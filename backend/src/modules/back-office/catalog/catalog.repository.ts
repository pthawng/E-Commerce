import { Injectable } from '@nestjs/common';
import { Prisma, ProductCatalogStatus, StockStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CatalogQueryDto } from './dto/catalog-query.dto';

@Injectable()
export class CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  get client() {
    return this.prisma;
  }

  async findProducts(query: CatalogQueryDto) {
    const where = this.buildWhere(query);
    const skip = (query.page - 1) * query.limit;
    const orderBy = this.buildOrderBy(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: this.productInclude(),
        orderBy,
        skip,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total };
  }

  async findProductById(id: string) {
    return this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: this.productInclude(true),
    });
  }

  async getOverview() {
    const [activeSkuCount, inWorkshopCount, draftCount, pendingApprovalCount, orderAggregate] =
      await this.prisma.$transaction([
        this.prisma.productVariant.count({
          where: {
            deletedAt: null,
            isActive: true,
            product: { deletedAt: null, catalogStatus: ProductCatalogStatus.PUBLISHED },
          },
        }),
        this.prisma.product.count({
          where: { deletedAt: null, catalogStatus: ProductCatalogStatus.WORKSHOP_REVIEW },
        }),
        this.prisma.product.count({
          where: { deletedAt: null, catalogStatus: ProductCatalogStatus.DRAFT },
        }),
        this.prisma.product.count({
          where: { deletedAt: null, catalogStatus: ProductCatalogStatus.PENDING_REVIEW },
        }),
        this.prisma.order.aggregate({
          _avg: { totalAmount: true },
        }),
      ]);

    return {
      activeSkuCount,
      activeSkuGrowth: 0,
      averageOrderValue: Number(orderAggregate._avg.totalAmount ?? 0),
      averageOrderValueGrowth: 0,
      inWorkshopCount,
      draftCount,
      pendingApprovalCount,
    };
  }

  productInclude(withAudit = false) {
    return {
      collection: true,
      primaryCategory: true,
      categories: { include: { category: true } },
      pricing: true,
      certificates: true,
      media: { orderBy: { order: 'asc' as const } },
      publishingWorkflow: {
        include: { steps: true },
      },
      variants: {
        where: { deletedAt: null },
        include: {
          catalogInventory: true,
          certificates: true,
          media: true,
        },
        orderBy: { position: 'asc' as const },
      },
      auditLogs: withAudit
        ? {
            orderBy: { createdAt: 'desc' as const },
            take: 30,
          }
        : false,
    } satisfies Prisma.ProductInclude;
  }

  private buildWhere(query: CatalogQueryDto): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = { deletedAt: null };

    if (query.collectionId) where.collectionId = query.collectionId;
    if (query.categoryId) {
      where.OR = [
        ...(where.OR ?? []),
        { primaryCategoryId: query.categoryId },
        { categories: { some: { categoryId: query.categoryId } } },
      ];
    }
    if (query.status) where.catalogStatus = query.status;
    if (query.stockStatus) {
      where.variants = {
        some: {
          catalogInventory: { stockStatus: query.stockStatus as StockStatus },
        },
      };
    }
    if (query.search?.trim()) {
      const search = query.search.trim();
      const searchLower = search.toLowerCase();
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { name: { path: ['vi'], string_contains: searchLower } },
            { name: { path: ['en'], string_contains: searchLower } },
            { slug: { contains: searchLower, mode: 'insensitive' } },
            { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } },
            {
              certificates: {
                some: { certificateNo: { contains: search, mode: 'insensitive' } },
              },
            },
          ],
        },
      ];
    }

    return where;
  }

  private buildOrderBy(query: CatalogQueryDto): Prisma.ProductOrderByWithRelationInput {
    if (query.sortBy === 'retailPrice') {
      return {
        pricing: { retailPrice: query.sortOrder },
      } as Prisma.ProductOrderByWithRelationInput;
    }
    if (query.sortBy === 'status') {
      return { catalogStatus: query.sortOrder };
    }
    if (query.sortBy === 'createdAt' || query.sortBy === 'updatedAt') {
      return { [query.sortBy]: query.sortOrder };
    }
    return { updatedAt: 'desc' };
  }
}
