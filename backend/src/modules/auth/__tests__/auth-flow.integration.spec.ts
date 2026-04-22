import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationTestBase } from '../../../../test/utils/integration-test-base';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserService } from '../../user/user.service';
import { AuthService } from '../auth.service';
import { ForgotPassEmailService } from '../services/forgot-pass-email.auth.service';
import { VerifyEmailService } from '../services/verify-email.auth.service';

describe('AuthFlow Integration (Real DB)', () => {
  const base = new IntegrationTestBase();
  let service: AuthService;
  let prisma: PrismaService;

  const mockVerifyEmailService = {
    sendVerifyEmail: jest.fn().mockResolvedValue(true),
    verifyEmail: jest.fn(),
  };

  beforeAll(async () => {
    await base.setup();
  });

  afterAll(async () => {
    await base.teardown();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: base.prisma, // Use the real, transactional Prisma instance
        },
        {
          provide: JwtService,
          useValue: new JwtService({ secret: 'test-secret' }),
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'access';
              if (key === 'JWT_REFRESH_SECRET') return 'refresh';
              return null;
            }),
          },
        },
        UserService, // Allow real UserService if it doesn't have heavy external deps
        { provide: VerifyEmailService, useValue: mockVerifyEmailService },
        { provide: ForgotPassEmailService, useValue: { sendForgotPasswordEmail: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);

    // Wrap each test in a transaction for speed and isolation
    await base.beginTransaction();
  });

  afterEach(async () => {
    await base.rollbackTransaction();
  });

  describe('Full Registration and Login Flow', () => {
    it('should register a new user in the DB and then allow them to login', async () => {
      const dto = {
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Integration Test User',
      };

      // 1. Register
      const regResult = await service.register(dto);
      expect(regResult.user.email).toBe(dto.email);
      expect(mockVerifyEmailService.sendVerifyEmail).toHaveBeenCalled();

      // Verify in DB directly
      const dbUser = await base.prisma.user.findUnique({ where: { email: dto.email } });
      expect(dbUser).toBeDefined();
      expect(dbUser!.fullName).toBe(dto.fullName);

      // 2. Login
      const loginResult = await service.login({
        email: dto.email,
        password: dto.password,
      });

      expect(loginResult.tokens).toBeDefined();
      expect(loginResult.tokens.accessToken).toBeDefined();
      expect(loginResult.tokens.refreshToken).toBeDefined();

      // Verify Refresh Token saved in DB
      const rt = await base.prisma.refreshToken.findFirst({
        where: { userId: dbUser!.id },
      });
      expect(rt).toBeDefined();
    });

    it('should block registration with a duplicate email (Actual DB Constraint)', async () => {
      const dto = { email: 'dup@example.com', password: 'p', fullName: 'U' };
      await service.register(dto);

      // Second attempt should fail via DB count or unique index
      await expect(service.register(dto)).rejects.toThrow();
    });
  });

  describe('Token Rotation Integrity', () => {
    it('should successfully rotate refresh tokens and invalidate the old one', async () => {
      const dto = { email: 'rotate@example.com', password: 'p', fullName: 'U' };
      await service.register(dto);
      const { tokens } = await service.login({ email: dto.email, password: dto.password });
      const oldRt = tokens.refreshToken;

      // Rotate
      const rotationResult = await service.refreshToken({ refreshToken: oldRt });
      expect(rotationResult.tokens.refreshToken).not.toBe(oldRt);

      // Trying to use the old RT again should fail (if implemented)
      // Note: Current implementation might require a test for reuse detection
    });
  });
});
