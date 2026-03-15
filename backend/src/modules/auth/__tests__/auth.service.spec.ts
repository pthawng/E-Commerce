import { BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserService } from '../../user/user.service';
import { AuthService } from '../auth.service';
import { ForgotPassEmailService } from '../services/forgot-pass-email.auth.service';
import { VerifyEmailService } from '../services/verify-email.auth.service';

jest.mock('argon2');
jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(() => 'test-jti'),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_ACCESS_SECRET') return 'access-secret';
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
      return null;
    }),
  };

  const mockUserService = {};
  const mockVerifyEmailService = {
    sendVerifyEmail: jest.fn(),
  };
  const mockForgotPassEmailService = {
    sendForgotPasswordEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UserService, useValue: mockUserService },
        { provide: VerifyEmailService, useValue: mockVerifyEmailService },
        { provide: ForgotPassEmailService, useValue: mockForgotPassEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
    };

    it('should successfully register a new user', async () => {
      mockPrismaService.user.count.mockResolvedValue(0);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockPrismaService.user.create.mockResolvedValue({ id: 'u1', email: registerDto.email, fullName: registerDto.fullName });
      mockJwtService.signAsync.mockResolvedValue('token');
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: registerDto.email,
        fullName: registerDto.fullName,
        userRoles: [],
      });

      const result = await service.register(registerDto);

      expect(result.user.email).toBe(registerDto.email);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockVerifyEmailService.sendVerifyEmail).toHaveBeenCalled();
    });

    it('should throw BadRequestException if email exists', async () => {
      mockPrismaService.user.count.mockResolvedValue(1);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should successfully login', async () => {
      const user = { id: 'u1', email: 'test@example.com', passwordHash: 'hash', userType: 'CUSTOMER' };
      mockPrismaService.user.findFirst.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue({ ...user, userRoles: [{ role: { slug: 'customer' } }] });
      mockJwtService.signAsync.mockResolvedValue('token');

      const result = await service.login(loginDto);

      expect(result.tokens).toBeDefined();
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2); // Access and Refresh
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'u1', passwordHash: 'hash' });
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should rotate tokens successfully', async () => {
      const payload = { sub: 'u1', aud: 'customer', jti: 'rt1' };
      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        token: 'hashed_rt',
        expiresAt: new Date(Date.now() + 10000),
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1', userRoles: [] });
      mockJwtService.signAsync.mockResolvedValue('new_token');

      const result = await service.refreshToken({ refreshToken: 'old_rt' });

      expect(result.tokens).toBeDefined();
      expect(mockPrismaService.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt1' } });
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalled(); // Save new rotated token
    });

    it('should throw ForbiddenException if token expired', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'u1', jti: 'rt1' });
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        token: 'hash',
        expiresAt: new Date(Date.now() - 10000),
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      await expect(service.refreshToken({ refreshToken: 'expired_rt' })).rejects.toThrow(ForbiddenException);
    });
  });
});
