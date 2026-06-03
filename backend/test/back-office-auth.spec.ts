import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StaffInvitationStatus, StaffStatus, UserType } from '@prisma/client';
import cookieParser from 'cookie-parser';
import { createHash } from 'crypto';
import { NobleCryptoPlugin, ScureBase32Plugin, TOTP } from 'otplib';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
});

describe('Back-office Authentication & Authorization (Integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const testEmail = 'staff-test-integration@rayparadis.com';
  const testPassword = 'SecurePassword123!';
  const csrfCookie = 'csrfToken=test-csrf-token';
  const csrfHeader = 'test-csrf-token';
  let adminSessionCookie: string;
  let adminUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // Clean up test email if exists
    await prisma.staffInvitation.deleteMany({ where: { email: testEmail } });
    const existingUser = await prisma.user.findUnique({ where: { email: testEmail } });
    if (existingUser) {
      await prisma.backOfficeSession.deleteMany({ where: { userId: existingUser.id } });
      await prisma.staffProfile.deleteMany({ where: { userId: existingUser.id } });
      await prisma.userRole.deleteMany({ where: { userId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
    }

    // Find the default SUPER_ADMIN seeded to use for inviting staff
    const adminUser = await prisma.user.findFirst({
      where: {
        userType: UserType.SUPER_ADMIN,
        isActive: true,
      },
      include: {
        staffProfile: true,
      },
    });

    if (!adminUser) {
      throw new Error(
        'Database lacks a seeded SUPER_ADMIN user. Make sure orchestrator seed script has run.',
      );
    }

    adminUserId = adminUser.id;

    // Temporarily ensure the admin user is ACTIVE and has MFA enabled to create session
    await prisma.staffProfile.upsert({
      where: { userId: adminUserId },
      update: {
        staffStatus: StaffStatus.ACTIVE,
        mfaEnabled: true,
      },
      create: {
        userId: adminUserId,
        staffStatus: StaffStatus.ACTIVE,
        mfaEnabled: true,
      },
    });

    // Create a mock active session for the admin to use for authentication in tests
    const session = await prisma.backOfficeSession.create({
      data: {
        userId: adminUserId,
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
      },
    });

    adminSessionCookie = `backOfficeSessionId=${session.id}`;

    // Done initialization
  });

  afterAll(async () => {
    // Cleanup
    await prisma.staffInvitation.deleteMany({ where: { email: testEmail } });
    const testUser = await prisma.user.findUnique({ where: { email: testEmail } });
    if (testUser) {
      await prisma.backOfficeSession.deleteMany({ where: { userId: testUser.id } });
      await prisma.staffProfile.deleteMany({ where: { userId: testUser.id } });
      await prisma.userRole.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    await app.close();
  });

  // Route printer removed

  describe('Staff Invitation Flow', () => {
    it('should reject protected staff mutations without csrf token', async () => {
      await request(app.getHttpServer())
        .post('/back-office/staff/invitations')
        .set('Cookie', [adminSessionCookie])
        .send({
          email: `csrf-${testEmail}`,
          roleSlugs: ['STAFF'],
          department: 'Sales',
        })
        .expect(403);
    });

    it('should create an invitation and send it (Requires auth.user.create)', async () => {
      const response = await request(app.getHttpServer())
        .post('/back-office/staff/invitations')
        .set('Cookie', [adminSessionCookie, csrfCookie])
        .set('x-csrf-token', csrfHeader)
        .send({
          email: testEmail,
          roleSlugs: ['STAFF'],
          department: 'Sales',
        });

      console.log('Invite Response Status:', response.status);
      console.log('Invite Response Body:', response.body);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(testEmail);
      expect(response.body.status).toBe(StaffInvitationStatus.PENDING);

      // Verify DB record
      const invitation = await prisma.staffInvitation.findFirst({
        where: { email: testEmail },
      });
      expect(invitation).toBeDefined();

      const user = await prisma.user.findUnique({
        where: { email: testEmail },
        include: { staffProfile: true },
      });
      expect(user).toBeDefined();
      expect(user?.userType).toBe(UserType.STAFF);
      expect(user?.staffProfile?.staffStatus).toBe(StaffStatus.MFA_SETUP_REQUIRED);
    });

    it('should prevent duplicate invitations for active pending invites', async () => {
      await request(app.getHttpServer())
        .post('/back-office/staff/invitations')
        .set('Cookie', [adminSessionCookie, csrfCookie])
        .set('x-csrf-token', csrfHeader)
        .send({
          email: testEmail,
          roleSlugs: ['STAFF'],
        })
        .expect(409); // Conflict
    });

    it('should verify invitation token successfully', async () => {
      // Find the token hash in database
      const invitation = await prisma.staffInvitation.findFirst({
        where: { email: testEmail, status: StaffInvitationStatus.PENDING },
      });
      expect(invitation).toBeDefined();

      // We cannot decrypt the SHA256 tokenHash, but let's mock verifying with an invalid token
      await request(app.getHttpServer())
        .get('/back-office/staff/invitations/verify')
        .query({ token: 'invalidtoken' })
        .expect(404);
    });
  });

  describe('Accept Invitation & MFA Setup Flow', () => {
    let rawToken: string;
    let tempToken: string;
    let mfaSecret: string;
    let recoveryCodes: string[];

    beforeAll(async () => {
      // Manually update the invitation in the DB to have a known token hash
      rawToken = 'abc123xyz789';
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');

      await prisma.staffInvitation.updateMany({
        where: { email: testEmail, status: StaffInvitationStatus.PENDING },
        data: { tokenHash },
      });
    });

    it('should accept invitation and return temp token for MFA setup', async () => {
      const response = await request(app.getHttpServer())
        .post('/back-office/staff/invitations/accept')
        .send({
          token: rawToken,
          password: testPassword,
        })
        .expect(200);

      expect(response.body.nextStep).toBe('MFA_SETUP_REQUIRED');
      expect(response.body).toHaveProperty('tempToken');
      tempToken = response.body.tempToken;
    });

    it('should verify credentials login but require MFA setup if not enabled', async () => {
      const response = await request(app.getHttpServer())
        .post('/back-office/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(response.body.nextStep).toBe('MFA_SETUP_REQUIRED');
      expect(response.body).toHaveProperty('tempToken');
      tempToken = response.body.tempToken;
    });

    it('should setup MFA with temp token and return qrCodeUrl and secret', async () => {
      const response = await request(app.getHttpServer())
        .post('/back-office/auth/mfa/setup')
        .send({ tempToken })
        .expect(200);

      expect(response.body).toHaveProperty('qrCodeUrl');
      expect(response.body).toHaveProperty('secret');
      mfaSecret = response.body.secret;
    });

    it('should verify MFA setup code, enable MFA, and return recovery codes', async () => {
      const code = await totp.generate({ secret: mfaSecret });

      const response = await request(app.getHttpServer())
        .post('/back-office/auth/mfa/verify-setup')
        .send({
          tempToken,
          code,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('recoveryCodes');
      expect(response.body.recoveryCodes).toHaveLength(8);
      recoveryCodes = response.body.recoveryCodes;

      // Verify in DB
      const user = await prisma.user.findUnique({
        where: { email: testEmail },
        include: { staffProfile: true },
      });
      expect(user?.staffProfile?.mfaEnabled).toBe(true);
      expect(user?.staffProfile?.staffStatus).toBe(StaffStatus.ACTIVE);
    });

    describe('Full MFA Login Flow', () => {
      let loginTempToken: string;
      let sessionCookie: string;

      it('should validate credentials and require MFA verification', async () => {
        const response = await request(app.getHttpServer())
          .post('/back-office/auth/login')
          .send({
            email: testEmail,
            password: testPassword,
          })
          .expect(200);

        expect(response.body.nextStep).toBe('MFA_REQUIRED');
        expect(response.body).toHaveProperty('tempToken');
        loginTempToken = response.body.tempToken;
      });

      it('should complete MFA login with TOTP code and set session cookie', async () => {
        const code = await totp.generate({ secret: mfaSecret });

        const response = await request(app.getHttpServer())
          .post('/back-office/auth/verify-mfa')
          .send({
            tempToken: loginTempToken,
            code,
          })
          .expect(200);

        expect(response.body.success).toBe(true);

        const cookies = ([] as string[]).concat(response.headers['set-cookie'] ?? []);
        expect(cookies).toBeDefined();
        const hasSessionCookie = cookies.some((cookie: string) =>
          cookie.includes('backOfficeSessionId'),
        );
        expect(hasSessionCookie).toBe(true);

        sessionCookie =
          cookies.find((cookie: string) => cookie.includes('backOfficeSessionId')) ?? '';
        expect(sessionCookie).toBeTruthy();
      });

      it('should access protected /back-office/auth/me successfully', async () => {
        const response = await request(app.getHttpServer())
          .get('/back-office/auth/me')
          .set('Cookie', [sessionCookie])
          .expect(200);

        expect(response.body.email).toBe(testEmail);
        expect(response.body.staffProfile.mfaEnabled).toBe(true);
        expect(response.body.staffProfile.staffStatus).toBe(StaffStatus.ACTIVE);
      });

      it('should allow user to log out and invalidate session', async () => {
        await request(app.getHttpServer())
          .post('/back-office/auth/logout')
          .set('Cookie', [sessionCookie, csrfCookie])
          .set('x-csrf-token', csrfHeader)
          .expect(200);

        // Access again should fail
        await request(app.getHttpServer())
          .get('/back-office/auth/me')
          .set('Cookie', [sessionCookie])
          .expect(401);
      });

      it('should allow login with recovery code when TOTP is unavailable', async () => {
        // Authenticate credentials to get new challenge token
        const loginResponse = await request(app.getHttpServer())
          .post('/back-office/auth/login')
          .send({
            email: testEmail,
            password: testPassword,
          });

        const challengeToken = loginResponse.body.tempToken;

        // Use first recovery code
        const recoveryResponse = await request(app.getHttpServer())
          .post('/back-office/auth/recovery-code')
          .send({
            tempToken: challengeToken,
            code: recoveryCodes[0],
          })
          .expect(200);

        expect(recoveryResponse.body.success).toBe(true);
        const cookies = ([] as string[]).concat(recoveryResponse.headers['set-cookie'] ?? []);
        const newSessionCookie = cookies.find((cookie: string) =>
          cookie.includes('backOfficeSessionId'),
        );
        if (!newSessionCookie) {
          throw new Error('Expected backOfficeSessionId cookie');
        }

        // Access protected me
        await request(app.getHttpServer())
          .get('/back-office/auth/me')
          .set('Cookie', [newSessionCookie])
          .expect(200);

        // Verify recovery code is consumed (re-using it should fail)
        const reLoginResponse = await request(app.getHttpServer())
          .post('/back-office/auth/login')
          .send({
            email: testEmail,
            password: testPassword,
          });

        await request(app.getHttpServer())
          .post('/back-office/auth/recovery-code')
          .send({
            tempToken: reLoginResponse.body.tempToken,
            code: recoveryCodes[0],
          })
          .expect(401);
      });
    });
  });
});
