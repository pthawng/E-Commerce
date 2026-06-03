import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ImportJobStatus,
  Prisma,
  ProductCatalogStatus,
  PublishingStepType,
  StockStatus,
  WorkflowStepStatus,
} from '@prisma/client';
import { slugify } from 'src/common/utils/string.helper';
import { CatalogRepository } from './catalog.repository';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { ChangeProductStatusDto } from './dto/change-product-status.dto';
import { CreateCatalogProductDto } from './dto/create-catalog-product.dto';
import { ImportCatalogDto } from './dto/import-catalog.dto';
import { UpdatePricingFormulaDto } from './dto/pricing-formula.dto';
import { UpdateCatalogProductDto } from './dto/update-catalog-product.dto';
import { toCatalogDetail, toCatalogListItem } from './mappers/catalog.mapper';
import { validateCatalogStatusTransition } from './validators/publish-rule.validator';

const WORKFLOW_STEPS = [
  PublishingStepType.DRAFT,
  PublishingStepType.MEDIA_CONTENT_REVIEW,
  PublishingStepType.PRICING_REVIEW,
  PublishingStepType.BOUTIQUE_DISTRIBUTION,
  PublishingStepType.ONLINE,
];

@Injectable()
export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}

  async findProducts(query: CatalogQueryDto) {
    const { items, total } = await this.repository.findProducts(query);
    return {
      data: items.map(toCatalogListItem),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  getOverview() {
    return this.repository.getOverview();
  }

  async getFilters() {
    const [collections, categories] = await this.repository.client.$transaction([
      this.repository.client.collection.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
      this.repository.client.category.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
    ]);

    return {
      collections,
      categories: categories.map((category) => ({
        ...category,
        name: this.localized(category.name),
      })),
    };
  }

  async getProduct(id: string) {
    const product = await this.repository.findProductById(id);
    if (!product) throw new NotFoundException('Catalog product not found');
    return toCatalogDetail(product);
  }

  async createProduct(dto: CreateCatalogProductDto, actorId?: string) {
    await this.validateReferences(dto.collectionId, dto.categoryId);
    await this.ensureSkuAvailable(dto.sku);

    const created = await this.repository.client.$transaction(async (tx) => {
      const slug = await this.uniqueSlug(slugify(dto.name), tx);
      const retailPrice = this.calculateRetailPrice(dto);
      const stockStatus = dto.stockStatus ?? this.deriveStockStatus(dto.stock, dto.preorderEnabled);

      const product = await tx.product.create({
        data: {
          name: { vi: dto.name, en: dto.name },
          slug,
          description: dto.description ? { vi: dto.description, en: dto.description } : undefined,
          collectionId: dto.collectionId,
          primaryCategoryId: dto.categoryId,
          catalogStatus: dto.status ?? ProductCatalogStatus.DRAFT,
          preorderEnabled: dto.preorderEnabled ?? false,
          pricingApproved: dto.pricingApproved ?? false,
          displayPriceMin: dto.retailPrice,
          displayPriceMax: dto.retailPrice,
          hasVariants: false,
          isActive: true,
          categories: { create: { categoryId: dto.categoryId } },
          media: dto.thumbnailUrl
            ? {
                create: {
                  url: dto.thumbnailUrl,
                  type: 'image',
                  isThumbnail: true,
                  order: 0,
                },
              }
            : undefined,
        },
      });

      const variant = await tx.productVariant.create({
        data: {
          productId: product.id,
          sku: dto.sku,
          price: dto.retailPrice,
          costPrice: dto.materialCost + dto.laborCost,
          variantTitle: { vi: 'Mặc định', en: 'Default' },
          isDefault: true,
          isActive: true,
          thumbnailUrl: dto.thumbnailUrl,
          catalogInventory: {
            create: {
              stock: dto.stock,
              stockStatus,
            },
          },
        },
      });

      await tx.productPricing.create({
        data: {
          productId: product.id,
          materialCost: dto.materialCost,
          laborCost: dto.laborCost,
          marginMultiplier: dto.marginMultiplier,
          boutiqueCoefficient: dto.boutiqueCoefficient,
          retailPrice,
          formulaVersion: 1,
          approvedAt: dto.pricingApproved ? new Date() : undefined,
        },
      });

      if (dto.certificate) {
        await tx.productCertificate.create({
          data: {
            productId: product.id,
            variantId: variant.id,
            certificateNo: dto.certificate,
            authority: dto.certificateAuthority ?? this.inferCertificateAuthority(dto.certificate),
          },
        });
      }

      await this.createWorkflow(product.id, tx);
      await this.writeAudit(tx, product.id, actorId, 'catalog.product.create', null, dto);

      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        include: this.repository.productInclude(true),
      });
    });

    return toCatalogDetail(created);
  }

  async updateProduct(id: string, dto: UpdateCatalogProductDto, actorId?: string) {
    const current = await this.repository.findProductById(id);
    if (!current) throw new NotFoundException('Catalog product not found');

    if (dto.collectionId || dto.categoryId) {
      await this.validateReferences(
        dto.collectionId ?? current.collectionId!,
        dto.categoryId ?? current.primaryCategoryId!,
      );
    }
    if (dto.sku) await this.ensureSkuAvailable(dto.sku, current.variants?.[0]?.id);

    const updated = await this.repository.client.$transaction(async (tx) => {
      const variant = current.variants?.[0];
      const retailPrice = dto.retailPrice
        ? this.calculateRetailPrice({ ...dto, retailPrice: dto.retailPrice })
        : undefined;
      const stockStatus =
        dto.stock !== undefined
          ? (dto.stockStatus ??
            this.deriveStockStatus(dto.stock, dto.preorderEnabled ?? current.preorderEnabled))
          : dto.stockStatus;

      const product = await tx.product.update({
        where: { id },
        data: {
          name: dto.name ? { vi: dto.name, en: dto.name } : undefined,
          description: dto.description ? { vi: dto.description, en: dto.description } : undefined,
          collectionId: dto.collectionId,
          primaryCategoryId: dto.categoryId,
          catalogStatus: dto.status,
          preorderEnabled: dto.preorderEnabled,
          pricingApproved: dto.pricingApproved,
          displayPriceMin: dto.retailPrice,
          displayPriceMax: dto.retailPrice,
          categories: dto.categoryId
            ? {
                deleteMany: {},
                create: { categoryId: dto.categoryId },
              }
            : undefined,
        },
      });

      if (variant) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            sku: dto.sku,
            price: dto.retailPrice,
            costPrice:
              dto.materialCost !== undefined || dto.laborCost !== undefined
                ? Number(dto.materialCost ?? current.pricing?.materialCost ?? 0) +
                  Number(dto.laborCost ?? current.pricing?.laborCost ?? 0)
                : undefined,
            thumbnailUrl: dto.thumbnailUrl,
            catalogInventory:
              dto.stock !== undefined || stockStatus
                ? {
                    upsert: {
                      create: {
                        stock: dto.stock ?? 0,
                        stockStatus: stockStatus ?? StockStatus.IN_STOCK,
                      },
                      update: {
                        stock: dto.stock,
                        stockStatus,
                      },
                    },
                  }
                : undefined,
          },
        });
      }

      if (
        retailPrice !== undefined ||
        dto.materialCost !== undefined ||
        dto.laborCost !== undefined
      ) {
        await tx.productPricing.upsert({
          where: { productId: id },
          create: {
            productId: id,
            materialCost: dto.materialCost ?? 0,
            laborCost: dto.laborCost ?? 0,
            marginMultiplier: dto.marginMultiplier ?? 4.2,
            boutiqueCoefficient: dto.boutiqueCoefficient ?? 0,
            retailPrice: retailPrice ?? dto.retailPrice ?? 0,
            approvedAt: dto.pricingApproved ? new Date() : undefined,
          },
          update: {
            materialCost: dto.materialCost,
            laborCost: dto.laborCost,
            marginMultiplier: dto.marginMultiplier,
            boutiqueCoefficient: dto.boutiqueCoefficient,
            retailPrice,
            approvedAt: dto.pricingApproved ? new Date() : undefined,
          },
        });
      }

      if (dto.thumbnailUrl) {
        await tx.productMedia.upsert({
          where: {
            id:
              current.media?.find((media) => media.isThumbnail)?.id ??
              '00000000-0000-0000-0000-000000000000',
          },
          create: {
            productId: id,
            url: dto.thumbnailUrl,
            type: 'image',
            isThumbnail: true,
            order: 0,
          },
          update: { url: dto.thumbnailUrl, isThumbnail: true },
        });
      }

      if (dto.certificate) {
        const certificate = current.certificates?.[0];
        if (certificate) {
          await tx.productCertificate.update({
            where: { id: certificate.id },
            data: {
              certificateNo: dto.certificate,
              authority:
                dto.certificateAuthority ?? this.inferCertificateAuthority(dto.certificate),
            },
          });
        } else {
          await tx.productCertificate.create({
            data: {
              productId: id,
              variantId: variant?.id,
              certificateNo: dto.certificate,
              authority:
                dto.certificateAuthority ?? this.inferCertificateAuthority(dto.certificate),
            },
          });
        }
      }

      await this.writeAudit(tx, id, actorId, 'catalog.product.update', current, dto);

      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        include: this.repository.productInclude(true),
      });
    });

    return toCatalogDetail(updated);
  }

  async changeStatus(id: string, dto: ChangeProductStatusDto, actorId?: string) {
    const product = await this.repository.findProductById(id);
    if (!product) throw new NotFoundException('Catalog product not found');

    validateCatalogStatusTransition(product, dto.status);

    const updated = await this.repository.client.$transaction(async (tx) => {
      const result = await tx.product.update({
        where: { id },
        data: {
          catalogStatus: dto.status,
          isActive: dto.status !== ProductCatalogStatus.ARCHIVED,
          publishedAt: dto.status === ProductCatalogStatus.PUBLISHED ? new Date() : undefined,
          archivedAt: dto.status === ProductCatalogStatus.ARCHIVED ? new Date() : undefined,
          publishingWorkflow: {
            upsert: {
              create: this.workflowCreateData(id, dto.status),
              update: {
                ...this.workflowUpdateData(dto.status),
                steps: {
                  deleteMany: {},
                  create: WORKFLOW_STEPS.map((step) => ({
                    step,
                    status: this.workflowStepStatus(step, dto.status),
                  })),
                },
              },
            },
          },
        },
        include: this.repository.productInclude(true),
      });

      await this.writeAudit(
        tx,
        id,
        actorId,
        'catalog.product.status.change',
        product.catalogStatus,
        {
          status: dto.status,
          reason: dto.reason,
        },
      );
      return result;
    });

    return toCatalogDetail(updated);
  }

  async getPricingFormula() {
    const formula = await this.repository.client.pricingFormula.findFirst({
      where: { isActive: true },
      orderBy: { version: 'desc' },
    });

    if (formula) {
      return {
        ...formula,
        materialCost: Number(formula.materialCost),
        laborCost: Number(formula.laborCost),
        marginMultiplier: Number(formula.marginMultiplier),
        boutiqueCoefficient: Number(formula.boutiqueCoefficient),
      };
    }

    return {
      version: 1,
      materialCost: 0,
      laborCost: 0,
      marginMultiplier: 4.2,
      boutiqueCoefficient: 0,
      currency: 'EUR',
    };
  }

  async updatePricingFormula(dto: UpdatePricingFormulaDto) {
    const active = await this.repository.client.pricingFormula.findFirst({
      where: { isActive: true },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (active?.version ?? 0) + 1;
    const created = await this.repository.client.$transaction(async (tx) => {
      await tx.pricingFormula.updateMany({ where: { isActive: true }, data: { isActive: false } });
      return tx.pricingFormula.create({
        data: {
          version: nextVersion,
          materialCost: dto.materialCost ?? Number(active?.materialCost ?? 0),
          laborCost: dto.laborCost ?? Number(active?.laborCost ?? 0),
          marginMultiplier: dto.marginMultiplier ?? Number(active?.marginMultiplier ?? 4.2),
          boutiqueCoefficient: dto.boutiqueCoefficient ?? Number(active?.boutiqueCoefficient ?? 0),
          currency: dto.currency ?? active?.currency ?? 'EUR',
          isActive: true,
        },
      });
    });

    return {
      ...created,
      materialCost: Number(created.materialCost),
      laborCost: Number(created.laborCost),
      marginMultiplier: Number(created.marginMultiplier),
      boutiqueCoefficient: Number(created.boutiqueCoefficient),
    };
  }

  async importCatalog(dto: ImportCatalogDto, actorId?: string) {
    const rows = dto.rows ?? [];
    if (!rows.length) {
      return this.repository.client.importJob.create({
        data: {
          fileName: dto.fileName ?? 'catalog-import',
          status: ImportJobStatus.FAILED,
          errorReport: [
            {
              row: 0,
              errors: [
                'CSV/XLSX parser is not configured; submit rows JSON or connect upload parser',
              ],
            },
          ],
          createdBy: actorId,
          completedAt: new Date(),
        },
      });
    }

    return this.repository.client.$transaction(async (tx) => {
      const job = await tx.importJob.create({
        data: {
          fileName: dto.fileName ?? 'catalog-import.json',
          status: ImportJobStatus.PROCESSING,
          totalRows: rows.length,
          createdBy: actorId,
        },
      });

      const errors: Array<{ row: number; errors: string[] }> = [];
      for (const [index, row] of rows.entries()) {
        const rowNo = index + 1;
        try {
          await this.validateReferences(row.collectionId, row.categoryId);
          await this.ensureSkuAvailable(row.sku);
        } catch (error) {
          errors.push({
            row: rowNo,
            errors: [error instanceof Error ? error.message : 'Invalid row'],
          });
        }
      }

      if (errors.length) {
        await tx.importJob.update({
          where: { id: job.id },
          data: {
            status: ImportJobStatus.FAILED,
            failedRows: errors.length,
            errorReport: errors,
            completedAt: new Date(),
          },
        });
        return tx.importJob.findUniqueOrThrow({ where: { id: job.id } });
      }

      for (const [index, row] of rows.entries()) {
        const slug = await this.uniqueSlug(slugify(row.name), tx);
        const product = await tx.product.create({
          data: {
            name: { vi: row.name, en: row.name },
            slug,
            collectionId: row.collectionId,
            primaryCategoryId: row.categoryId,
            catalogStatus: row.status ?? ProductCatalogStatus.DRAFT,
            displayPriceMin: row.retailPrice,
            displayPriceMax: row.retailPrice,
            categories: { create: { categoryId: row.categoryId } },
            variants: {
              create: {
                sku: row.sku,
                price: row.retailPrice,
                isDefault: true,
                catalogInventory: {
                  create: {
                    stock: row.stock,
                    stockStatus:
                      row.stockStatus ?? this.deriveStockStatus(row.stock, row.preorderEnabled),
                  },
                },
              },
            },
            pricing: {
              create: {
                materialCost: row.materialCost,
                laborCost: row.laborCost,
                marginMultiplier: row.marginMultiplier,
                boutiqueCoefficient: row.boutiqueCoefficient,
                retailPrice: this.calculateRetailPrice(row),
              },
            },
          },
        });
        await tx.importJobItem.create({
          data: {
            importJobId: job.id,
            productId: product.id,
            rowNumber: index + 1,
            status: 'IMPORTED',
          },
        });
      }

      return tx.importJob.update({
        where: { id: job.id },
        data: {
          status: ImportJobStatus.COMPLETED,
          successRows: rows.length,
          completedAt: new Date(),
        },
      });
    });
  }

  private calculateRetailPrice(dto: Partial<CreateCatalogProductDto>) {
    if (dto.retailPrice) return dto.retailPrice;
    return (
      (Number(dto.materialCost ?? 0) + Number(dto.laborCost ?? 0)) *
        Number(dto.marginMultiplier ?? 4.2) +
      Number(dto.boutiqueCoefficient ?? 0)
    );
  }

  private deriveStockStatus(stock = 0, preorderEnabled = false) {
    if (stock <= 0) return preorderEnabled ? StockStatus.PRE_ORDER : StockStatus.OUT_OF_STOCK;
    if (stock <= 2) return StockStatus.LOW_STOCK;
    return StockStatus.IN_STOCK;
  }

  private async validateReferences(collectionId: string, categoryId: string) {
    const [collection, category] = await Promise.all([
      this.repository.client.collection.findFirst({
        where: { id: collectionId, deletedAt: null, isActive: true },
      }),
      this.repository.client.category.findFirst({ where: { id: categoryId, isActive: true } }),
    ]);
    if (!collection) throw new BadRequestException('Collection is invalid');
    if (!category) throw new BadRequestException('Category is invalid');
  }

  private async ensureSkuAvailable(sku: string, exceptVariantId?: string) {
    const existing = await this.repository.client.productVariant.findUnique({ where: { sku } });
    if (existing && existing.id !== exceptVariantId) {
      throw new BadRequestException(`SKU already exists: ${sku}`);
    }
  }

  private async uniqueSlug(slug: string, tx: Prisma.TransactionClient) {
    let candidate = slug || `catalog-${Date.now()}`;
    let counter = 1;
    while (await tx.product.findUnique({ where: { slug: candidate } })) {
      candidate = `${slug}-${counter++}`;
    }
    return candidate;
  }

  private async createWorkflow(productId: string, tx: Prisma.TransactionClient) {
    await tx.publishingWorkflow.create({
      data: {
        productId,
        status: 'DRAFT',
        currentStep: 'DRAFT',
        steps: {
          create: WORKFLOW_STEPS.map((step, index) => ({
            step,
            status: index === 0 ? WorkflowStepStatus.IN_PROGRESS : WorkflowStepStatus.PENDING,
            assignedRole:
              step === PublishingStepType.PRICING_REVIEW
                ? 'finance'
                : step === PublishingStepType.ONLINE
                  ? 'operations'
                  : 'curator',
          })),
        },
      },
    });
  }

  private workflowCreateData(productId: string, status: ProductCatalogStatus) {
    return {
      productId,
      ...this.workflowUpdateData(status),
      steps: {
        create: WORKFLOW_STEPS.map((step) => ({
          step,
          status: this.workflowStepStatus(step, status),
        })),
      },
    };
  }

  private workflowUpdateData(status: ProductCatalogStatus) {
    const currentStep =
      status === ProductCatalogStatus.PUBLISHED
        ? PublishingStepType.ONLINE
        : status === ProductCatalogStatus.PENDING_REVIEW
          ? PublishingStepType.MEDIA_CONTENT_REVIEW
          : status === ProductCatalogStatus.WORKSHOP_REVIEW
            ? PublishingStepType.PRICING_REVIEW
            : PublishingStepType.DRAFT;
    return {
      status:
        status === ProductCatalogStatus.PUBLISHED
          ? 'LIVE'
          : status === ProductCatalogStatus.DRAFT
            ? 'DRAFT'
            : 'IN_REVIEW',
      currentStep,
    } as const;
  }

  private workflowStepStatus(step: PublishingStepType, status: ProductCatalogStatus) {
    const active = this.workflowUpdateData(status).currentStep;
    if (status === ProductCatalogStatus.PUBLISHED) return WorkflowStepStatus.COMPLETED;
    return step === active ? WorkflowStepStatus.IN_PROGRESS : WorkflowStepStatus.PENDING;
  }

  private async writeAudit(
    tx: Prisma.TransactionClient,
    productId: string,
    actorId: string | undefined,
    action: string,
    before: unknown,
    after: unknown,
  ) {
    await tx.productAuditLog.create({
      data: {
        productId,
        actorId,
        action,
        before: before === null ? undefined : this.toJson(before),
        after: after === null ? undefined : this.toJson(after),
      },
    });
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(
      JSON.stringify(value, (_key, item) => {
        if (item instanceof Date) return item.toISOString();
        return item;
      }),
    ) as Prisma.InputJsonValue;
  }

  private inferCertificateAuthority(certificate: string) {
    return certificate.split(/\s+/)[0]?.replace(/[^A-Za-z]/g, '') || 'UNKNOWN';
  }

  private localized(value: unknown) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      return (
        (typeof record.vi === 'string' && record.vi) ||
        (typeof record.en === 'string' && record.en) ||
        Object.values(record).find((item): item is string => typeof item === 'string') ||
        ''
      );
    }
    return '';
  }
}
