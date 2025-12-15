import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto, PaginationService, type PaginatedResult } from 'src/common/pagination';
import type { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { UserResponseDto } from '@modules/user/dto/user-response.dto';
import type { User } from '@shared';
import argon2 from 'argon2';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

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

    const baseWhere: UserWhereInput = { deletedAt: null };

    const result = await this.paginationService.paginate<PrismaUser>({
      findMany: (args) => {
        const where: UserWhereInput = args.where ? { ...baseWhere, ...args.where } : baseWhere;

        return this.prisma.user.findMany({
          where,
          orderBy: args.orderBy as Prisma.UserOrderByWithRelationInput,
          skip: args.skip,
          take: args.take,
        });
      },
      count: (args) => {
        const where: UserWhereInput = args.where ? { ...baseWhere, ...args.where } : baseWhere;

        return this.prisma.user.count({ where });
      },
      dto,
      where: baseWhere,
      allowedSortFields: ['createdAt', 'email', 'fullName', 'updatedAt'],
      defaultSort: { field: 'createdAt', order: 'desc' },
      basePath: '/users',
    });

    return {
      ...result,
      items: result.items.map((u) => plainToInstance(UserResponseDto, u)),
    };
  }

  // ---------------------------
  // GET ONE USER
  // ---------------------------
  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    return plainToInstance(UserResponseDto, user);
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
      },
    });

    return plainToInstance(UserResponseDto, updated);
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
}
