import { UserResponseDto } from '@modules/user/dto/user-response.dto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { User } from '@shared';
import argon2 from 'argon2';
import { plainToInstance } from 'class-transformer';
import { PaginationDto, PaginationService, type PaginatedResult } from 'src/common/pagination';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GuestCustomerResponseDto } from './dto/guest-customer-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Creates a new user.
   */
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

  /**
   * Retrieves all users.
   */
  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => {
      return plainToInstance(UserResponseDto, u);
    });
  }

  /**
   * Retrieves a paginated list of users with lifetime value metrics.
   */
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

    // Bulk calculate lifetime values for the paginated items
    const userIds = result.items.map((u: any) => u.id);
    const ltvAgg = await this.prisma.order.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        status: { not: 'CANCELLED' as any },
      },
      _sum: { totalAmount: true },
    });

    const ltvMap = new Map(ltvAgg.map((a) => [a.userId, Number(a._sum.totalAmount || 0)]));

    const items = result.items.map((u: any) => {
      const orderCount = u._count?.orders ?? 0;
      const ltv = ltvMap.get(u.id) || 0;

      // Calculate dynamic segment
      let segment = 'PROSPECT';
      if (ltv > 100000000) segment = 'VIP';
      else if (orderCount > 3) segment = 'LOYAL';
      else if (orderCount > 0) segment = 'ACTIVE';

      // Strip internal Prisma structures
      const { _count, orders, ...userPlain } = u;
      const mapped: any = plainToInstance(UserResponseDto, userPlain);

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

  /**
   * Retrieves a single user by ID.
   */
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

    // Calculate patron intelligence metrics
    const orderCount = (user as any)._count?.orders ?? 0;
    const ltv =
      (user as any).orders?.reduce((acc: number, o: any) => {
        const amt = Number(o.totalAmount);
        return acc + (isNaN(amt) ? 0 : amt);
      }, 0) ?? 0;

    // Strip internal database fields
    const { _count, orders, ...userPlain } = user as any;

    const mapped: any = plainToInstance(UserResponseDto, userPlain);

    // Hydrate response properties
    mapped.orderCount = orderCount;
    mapped.ltv = ltv;

    return mapped;
  }

  /**
   * Retrieves a paginated list of guest customers with lifetime value metrics.
   */
  async findAllGuestCustomersPaginated(dto: any) {
    const page = Number(dto.page || 1);
    const limit = Number(dto.limit || 20);
    const skip = (page - 1) * limit;

    // Fetch aggregated guest transaction details
    const guestCounts = await this.prisma.order.groupBy({
      by: ['guestEmail'],
      where: {
        userId: null,
        guestEmail: { not: null, notIn: [''] },
      },
      _count: { _all: true },
      _sum: { totalAmount: true },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: 'desc' } },
      skip,
      take: limit,
    });

    // Retrieve the total count of guest customer orders
    const totalCountResult = await this.prisma.order.aggregate({
      where: { userId: null, guestEmail: { not: null, notIn: [''] } },
      _count: { guestEmail: true },
    });

    // Accurate distinct count in Prisma for large datasets is expensive.
    // Large scale data may require a denormalized view or hyperloglog representation.
    const total = totalCountResult._count.guestEmail;

    const items = guestCounts.map((g) => ({
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
        self: `/admin/crm/guests?page=${page}&limit=${limit}`,
      },
    };
  }

  /**
   * Updates an existing user's information.
   */
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

    // Hash password if provided by the client
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

  /**
   * Performs a soft delete on a user by setting the deletion timestamp.
   */
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
   * Retrieves patron strategic analytics using database-level aggregations.
   */
  async getPatronStrategicStats() {
    // Fetch the top patrons by lifetime value using database aggregation
    const topPatronsAgg = await this.prisma.order.groupBy({
      by: ['userId'],
      where: {
        userId: { not: null },
        status: { not: 'CANCELLED' as any },
      },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 100,
    });

    // Retrieve names for the top patrons in a single query
    const userIds = topPatronsAgg.map((p) => p.userId as string);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u.fullName]));

    const patronMetrics = topPatronsAgg.map((p) => ({
      id: p.userId,
      fullName: userMap.get(p.userId as string) || 'Unknown Patron',
      ltv: Number(p._sum.totalAmount || 0),
    }));

    // Calculate overall statistics using database aggregation
    const overallStats = await this.prisma.order.aggregate({
      where: {
        userId: { not: null },
        status: { not: 'CANCELLED' as any },
      },
      _sum: { totalAmount: true },
      _count: { userId: true },
    });

    const uniquePatronCount = await this.prisma.user.count({
      where: { deletedAt: null },
    });

    const totalLtv = Number(overallStats._sum.totalAmount || 0);
    const averageLtv = uniquePatronCount > 0 ? totalLtv / uniquePatronCount : 0;

    const bespokeInquiries = await this.prisma.order.count({
      where: { status: 'IN_PRODUCTION' as any },
    });

    return {
      topPatron: patronMetrics[0]
        ? { name: patronMetrics[0].fullName, ltv: patronMetrics[0].ltv }
        : null,
      averageLtv: Number(averageLtv.toFixed(2)),
      newInquiries: bespokeInquiries,
      patronCount: uniquePatronCount,
      topPatrons: patronMetrics.slice(0, 5),
    };
  }
}
