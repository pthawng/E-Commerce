import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { UserResponseDto } from '@modules/user/dto/user-response.dto';
import argon2 from 'argon2';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------
  // CREATE USER
  // ---------------------------
  async create(dto: CreateUserDto) {
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
  async findAll() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => {
      return plainToInstance(UserResponseDto, u);
    });
  }

  // ---------------------------
  // GET ONE USER
  // ---------------------------
  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    return plainToInstance(UserResponseDto, user);
  }

  // ---------------------------
  // UPDATE USER
  // ---------------------------
  async update(id: string, dto: UpdateUserDto) {
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

    // Hash password with argon2

    const passwordHash = await argon2.hash(dto.password!, {
      type: argon2.argon2id,
      timeCost: 2,
      memoryCost: 19456,
      parallelism: 1,
    });

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email ?? user.email,
        phone: dto.phone ?? user.phone,
        fullName: dto.fullName ?? user.fullName,
        passwordHash: passwordHash ?? user.passwordHash,
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
