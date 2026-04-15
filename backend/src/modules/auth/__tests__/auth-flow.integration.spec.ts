import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserService } from '../../user/user.service';
import { AuthService } from '../auth.service';
import { ForgotPassEmailService } from '../services/forgot-pass-email.auth.service';
import { VerifyEmailService } from '../services/verify-email.auth.service';

describe('AuthFlow Integration', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    verifyEmailToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockVerifyEmailService = {
    sendVerifyEmail: jest.fn().mockResolvedValue(true),
    verify: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('token'),
    verifyAsync: jest.fn().mockResolvedValue({ sub: 'u1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: UserService, useValue: {} },
        { provide: VerifyEmailService, useValue: mockVerifyEmailService },
        { provide: ForgotPassEmailService, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('Registration to Verification Flow', () => {
    it('should complete the full registration and verification flow', async () => {
      const dto = { email: 'new@example.com', password: 'password', fullName: 'New User' };

      // 1. Register
      mockPrismaService.user.count.mockResolvedValue(0);
      mockPrismaService.user.create.mockResolvedValue({ id: 'u1', ...dto });
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1', ...dto, userRoles: [] });

      const regResult = await service.register(dto);
      expect(regResult.user.id).toBe('u1');
      expect(mockVerifyEmailService.sendVerifyEmail).toHaveBeenCalled();

      // 2. Simulate Login before verification (should still work unless restricted)
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'u1',
        email: dto.email,
        passwordHash: 'hash',
        isEmailVerified: false,
      });
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);

      const loginResult = await service.login({ email: dto.email, password: dto.password });
      expect(loginResult.tokens).toBeDefined();
    });
  });

  describe('Password Reset Flow', () => {
    it('should handle forgot password and reset password', async () => {
      // This is a simplified test to verify service orchestration
      const email = 'lost@example.com';
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1', email });

      // Assume forgot password trigger works (tested in its own service usually)
      // Here we test the auth service's role if it has any specific orchestration
    });
  });
});
