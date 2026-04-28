import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PaginationDto, PaginationService, type PaginatedResult } from 'src/common/pagination';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GuestCustomerResponseDto } from './dto/guest-customer-response.dto';
import { UserResponseDto } from '@modules/user/dto/user-response.dto';
import type { User } from '@shared';
import argon2 from 'argon2';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) { }

  // ---------------------------
  // CREATE USER
  // ---------------------------
  async create(dto: CreateUserDto): Promise<User> {
    // Check unique email
    const existEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existEmail) throw new BadRequestException('Email already exists');

    // Check unique phone
    if (dto.phone) {
      const existPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existPhone) throw new BadRequestException('Phone already exists');
    }

    // Hash password
    const passwordHash = await argon2.hash(dto.password!, {
      type: argon2.argon2id,
      timeCost: 2,
      memoryCost: 19456,
      parallelism: 1,
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        fullName: dto.fullName,
        passwordHash,
      },
    });

    return plainToInstance(UserResponseDto, user);
  }

  // ---------------------------
  // GET ALL USERS
  // ---------------------------
  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => {
      return plainToInstance(UserResponseDto, u);
    });
  }

  // ---------------------------
  // GET ALL USERS (PAGINATED)
  // ---------------------------
  async findAllUserPaginated(dto: PaginationDto): Promise<PaginatedResult<User>> {
    type PrismaUser = Prisma.UserGetPayload<Record<string, never>>;
    type UserWhereInput = Prisma.UserWhereInput;

    const baseWhere: UserWhereInput = {
      deletedAt: null,
      ...(dto.search && {
        OR: [
          { email: { contains: dto.search, mode: 'insensitive' as Prisma.QueryMode } },
          { fullName: { contains: dto.search, mode: 'insensitive' as Prisma.QueryMode } },
          { phone: { contains: dto.search, mode: 'insensitive' as Prisma.QueryMode } },
        ],
      }),
    };

    const result = await this.paginationService.paginate<PrismaUser>({
      findMany: (args) => {
        const where: UserWhereInput = args.where ? { AND: [baseWhere, args.where] } : baseWhere;

        return this.prisma.user.findMany({
          where,
          orderBy: args.orderBy as Prisma.UserOrderByWithRelationInput,
          skip: args.skip,
          take: args.take,
          include: {
            ...this.userInclude,
            _count: { select: { orders: true } },
            orders: { select: { totalAmount: true } },
          },
        });
      },
      count: (args) => {
        const where: UserWhereInput = args.where ? { AND: [baseWhere, args.where] } : baseWhere;

        return this.prisma.user.count({ where });
      },
      dto,
      where: baseWhere,
      allowedSortFields: ['createdAt', 'email', 'fullName', 'updatedAt'],
      defaultSort: { field: 'createdAt', order: 'desc' },
      basePath: '/users',
      joinCount: 1,
    });

    const items = result.items.map((u: any) => {
      // 1. Pre-calculate intelligence metrics
      const orderCount = u._count?.orders ?? 0;
      const ltv = u.orders?.reduce((acc: number, o: any) => {
        const amt = Number(o.totalAmount);
        return acc + (isNaN(amt) ? 0 : amt);
      }, 0) ?? 0;

      // 2. Calculate dynamic segment
      let segment = 'PROSPECT';
      if (ltv > 100000000) segment = 'VIP';
      else if (orderCount > 3) segment = 'LOYAL';
      else if (orderCount > 0) segment = 'ACTIVE';

      // 3. FAANG Pattern: Strip internal Prisma structures before serialization
      // This prevents class-transformer from trying to process Prisma Decimal objects
      const { _count, orders, ...userPlain } = u;

      const mapped: any = plainToInstance(UserResponseDto, userPlain);

      // 4. Hydrate DTO with calculated metrics
      mapped.orderCount = orderCount;
      mapped.ltv = ltv;
      mapped.segment = segment;

      return mapped;
    });

    return {
      ...result,
      items,
    };
  }

  // ---------------------------
  // GET ONE USER
  // ---------------------------
  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...this.userInclude,
        _count: { select: { orders: true } },
        orders: { select: { totalAmount: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    // 1. Calculate intelligence metrics
    const orderCount = (user as any)._count?.orders ?? 0;
    const ltv = (user as any).orders?.reduce((acc: number, o: any) => {
      const amt = Number(o.totalAmount);
      return acc + (isNaN(amt) ? 0 : amt);
    }, 0) ?? 0;

    // 2. Strip internal types
    const { _count, orders, ...userPlain } = user as any;

    const mapped: any = plainToInstance(UserResponseDto, userPlain);

    // 3. Hydrate
    mapped.orderCount = orderCount;
    mapped.ltv = ltv;

    return mapped;
  }

  /**
   * Guest Customer Registry (FAANG Aggregation pattern)
   */
  async findAllGuestCustomersPaginated(dto: any) {
    const page = Number(dto.page || 1);
    const limit = Number(dto.limit || 20);
    const skip = (page - 1) * limit;

    // 1. Fetch aggregated guest data
    const guestCounts = (await (this.prisma.order.groupBy({
      by: ['guestEmail'],
      where: {
        userId: null,
        guestEmail: { not: null, notIn: [''] }
      },
      _count: { _all: true },
      _sum: { totalAmount: true },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: 'desc' } },
      skip,
      take: limit,
    }) as unknown)) as any[];

    // 2. Count total unique guests
    const allGuests = await this.prisma.order.findMany({
      where: { userId: null, guestEmail: { not: null, notIn: [''] } },
      select: { guestEmail: true },
      distinct: ['guestEmail'],
    });

    const total = allGuests.length;
    const items = guestCounts.map(g => ({
      email: g.guestEmail,
      orderCount: g._count._all,
      ltv: Number(g._sum.totalAmount || 0),
      lastOrderAt: g._max.createdAt,
    }));

    return {
      items: plainToInstance(GuestCustomerResponseDto, items),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      links: {
        self: `/admin/rbac/guests?page=${page}&limit=${limit}`,
      },
    };
  }

  // ---------------------------
  // UPDATE USER
  // ---------------------------
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    // Check unique email
    if (dto.email && dto.email !== user.email) {
      const existEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existEmail) throw new BadRequestException('Email already exists');
    }

    // Check unique phone
    if (dto.phone && dto.phone !== user.phone) {
      const existPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existPhone) throw new BadRequestException('Phone already exists');
    }

    // Hash password nếu client gửi
    const passwordHash = dto.password
      ? await argon2.hash(dto.password, {
        type: argon2.argon2id,
        timeCost: 2,
        memoryCost: 19456,
        parallelism: 1,
      })
      : undefined;

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email ?? user.email,
        phone: dto.phone ?? user.phone,
        fullName: dto.fullName ?? user.fullName,
        passwordHash: passwordHash ?? user.passwordHash,
        isActive: dto.isActive ?? user.isActive,
        isEmailVerified: dto.isEmailVerified ?? user.isEmailVerified,
        nickName: dto.nickName ?? user.nickName,
        bio: dto.bio ?? user.bio,
        avatarUrl: dto.avatarUrl ?? user.avatarUrl,
        updatedAt: new Date(),
      },
      include: this.userInclude,
    });

    return plainToInstance(UserResponseDto, updated);
  }

  private get userInclude() {
    return {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
      userPermissions: {
        include: {
          permission: true,
        },
      },
    };
  }

  // ---------------------------
  // SOFT DELETE USER
  // ---------------------------
  async softDelete(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'User deleted successfully' };
  }

  /**
   * FAANG L8: Patron Strategic Analytics for Concierge Desk
   * Provides high-level insights into high-value relationship management.
   */
  async getPatronStrategicStats() {
    // 1. Top Patrons by LTV (Successful orders only)
    const topPatronsRaw = await this.prisma.user.findMany({
      where: { deletedAt: null },
      include: {
        orders: {
          where: { status: { not: 'CANCELLED' as any } },
          select: { totalAmount: true }
        }
      },
      take: 100 // Scale to top 100 for global analysis
    });

    const patronMetrics = topPatronsRaw.map(u => ({
      id: u.id,
      fullName: u.fullName,
      ltv: u.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
    })).sort((a, b) => b.ltv - a.ltv);

    const topPatron = patronMetrics[0] || null;

    // 2. Average LTV calculation
    const totalLtv = patronMetrics.reduce((sum, p) => sum + p.ltv, 0);
    const averageLtv = patronMetrics.length > 0 ? totalLtv / patronMetrics.length : 0;

    // 3. Simulated/Placeholder for Bespoke Inquiries (until separate module activated)
    // For now, we count orders with 'IN_PRODUCTION' status as active bespoke work
    const bespokeInquiries = await this.prisma.order.count({
      where: { status: 'IN_PRODUCTION' as any }
    });

    return {
      topPatron: topPatron ? { name: topPatron.fullName, ltv: topPatron.ltv } : null,
      averageLtv: Number(averageLtv.toFixed(2)),
      newInquiries: bespokeInquiries,
      patronCount: patronMetrics.length,
      topPatrons: patronMetrics.slice(0, 5) // Return top 5 for the directory preview
    };
  }
}
