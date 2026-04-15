import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { PermissionCacheService } from '../cache/permission-cache.service';
import { RbacService } from '../rbac.service';

describe('RbacService', () => {
  let service: RbacService;
  let prisma: PrismaService;
  let cache: PermissionCacheService;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    userRole: { findMany: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
    userPermission: { findMany: jest.fn(), upsert: jest.fn() },
    role: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    permission: { findUnique: jest.fn(), findMany: jest.fn(), upsert: jest.fn() },
    rolePermission: { upsert: jest.fn() },
  };

  const mockCacheService = {
    clearCache: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PermissionCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<RbacService>(RbacService);
    prisma = module.get<PrismaService>(PrismaService);
    cache = module.get<PermissionCacheService>(PermissionCacheService);
    jest.clearAllMocks();
  });

  describe('getUserPermissions', () => {
    it('should aggregate permissions from roles and direct assignments', async () => {
      const rolePerms = [{ role: { rolePermissions: [{ permission: { action: 'p1' } }] } }];
      const directPerms = [{ permission: { action: 'p2' } }];

      mockPrismaService.userRole.findMany.mockResolvedValue(rolePerms);
      mockPrismaService.userPermission.findMany.mockResolvedValue(directPerms);

      const result = await service.getUserPermissions('u1');

      expect(result).toContain('p1');
      expect(result).toContain('p2');
      expect(result.length).toBe(2);
    });

    it('should return unique permissions', async () => {
      mockPrismaService.userRole.findMany.mockResolvedValue([
        { role: { rolePermissions: [{ permission: { action: 'p1' } }] } },
      ]);
      mockPrismaService.userPermission.findMany.mockResolvedValue([
        { permission: { action: 'p1' } },
      ]);

      const result = await service.getUserPermissions('u1');
      expect(result).toEqual(['p1']);
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role and clear user cache', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1', isActive: true });
      mockPrismaService.role.findUnique.mockResolvedValue({ id: 'r1', slug: 'admin' });
      mockPrismaService.userRole.upsert.mockResolvedValue({});

      await service.assignRoleToUser('u1', 'admin');

      expect(mockPrismaService.userRole.upsert).toHaveBeenCalled();
      expect(cache.clearCache).toHaveBeenCalledWith('u1');
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.assignRoleToUser('u1', 'admin')).rejects.toThrow(UnauthorizedException);
    });
  });
});
