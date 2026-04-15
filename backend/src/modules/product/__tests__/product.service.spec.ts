import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaginationService } from 'src/common/pagination';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductService } from '../product.service';
import { ProductStorageService } from '../product.storage/product-storage.service';
import { VariantService } from '../variants/variant.service';

describe('ProductService', () => {
  let service: ProductService;
  let prisma: PrismaService;

  const mockPrismaService = {
    product: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    productCategory: {
      createMany: jest.fn(),
    },
    productMedia: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    attributeValue: {
      count: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockPaginationService = {
    paginate: jest.fn(),
  };

  const mockProductStorageService = {
    uploadMedia: jest.fn(),
  };

  const mockVariantService = {
    createVariant: jest.fn(),
    recalculateDisplayPrice: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PaginationService, useValue: mockPaginationService },
        { provide: ProductStorageService, useValue: mockProductStorageService },
        { provide: VariantService, useValue: mockVariantService },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    const createDto = {
      name: { vi: 'Sản phẩm mới' },
      slug: 'san-pham-moi',
      basePrice: 100000,
      hasVariants: false,
    };

    it('should successfully create a product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null); // Slug unique
      mockPrismaService.product.create.mockResolvedValue({ id: 'p1', slug: 'san-pham-moi' });
      mockPrismaService.product.findUniqueOrThrow.mockResolvedValue({ id: 'p1' });

      const result = await service.createProduct(createDto as any);

      expect(result).toBeDefined();
      expect(mockPrismaService.product.create).toHaveBeenCalled();
      expect(mockVariantService.createVariant).toHaveBeenCalled();
      expect(mockVariantService.recalculateDisplayPrice).toHaveBeenCalled();
    });

    it('should throw BadRequestException if name is missing', async () => {
      await expect(service.createProduct({ name: {} } as any)).rejects.toThrow(BadRequestException);
    });

    it('should generate unique slug if collision occurs', async () => {
      mockPrismaService.product.findUnique
        .mockResolvedValueOnce({ id: 'p_old' }) // first check: exists
        .mockResolvedValue(null); // second check: unique
      mockPrismaService.product.create.mockResolvedValue({ id: 'p1', slug: 'san-pham-moi-1' });
      mockPrismaService.product.findUniqueOrThrow.mockResolvedValue({ id: 'p1' });

      await service.createProduct(createDto as any);

      expect(mockPrismaService.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'san-pham-moi-1' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product if found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({ id: 'p1' });
      const result = await service.findOne('p1');
      expect(result).toEqual({ id: 'p1' });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);
      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
    });
  });
});
