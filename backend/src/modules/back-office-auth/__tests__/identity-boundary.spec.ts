import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { StaffStatus, UserType } from '@prisma/client';
import { BackOfficeAuthGuard } from '../guards/back-office-auth.guard';
import { BackOfficeAuthService } from '../services/back-office-auth.service';
import { BackOfficeStaffService } from '../services/back-office-staff.service';

describe('Back-office identity boundary', () => {
  describe('BackOfficeStaffService.inviteStaff', () => {
    it('does not mutate an existing customer identity when inviting as staff', async () => {
      const existingCustomer = {
        id: 'user-1',
        email: 'customer@example.com',
        userType: UserType.CUSTOMER,
        staffProfile: null,
      };
      const role = { id: 'role-1', slug: 'STAFF' };
      const tx = {
        user: {
          create: jest.fn(),
          update: jest.fn(),
        },
        staffProfile: {
          create: jest.fn(),
          update: jest.fn(),
        },
        userRole: {
          deleteMany: jest.fn(),
          createMany: jest.fn(),
        },
      };
      const prisma = {
        staffInvitation: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 'invite-1', email: existingCustomer.email }),
        },
        role: {
          findMany: jest.fn().mockResolvedValue([role]),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(existingCustomer),
        },
        $transaction: jest.fn((callback: (txClient: typeof tx) => Promise<void>) => callback(tx)),
      };
      const service = staffService(prisma);

      await service.inviteStaff(
        { email: existingCustomer.email, roleSlugs: ['STAFF'], department: 'Sales' },
        'admin-1',
      );

      expect(tx.user.update).not.toHaveBeenCalled();
      expect(tx.staffProfile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: existingCustomer.id,
          staffStatus: StaffStatus.MFA_SETUP_REQUIRED,
        }),
      });
      expect(tx.userRole.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ userId: existingCustomer.id, roleId: role.id })],
      });
    });

    it('does not re-invite an already active staff member and reset their lifecycle', async () => {
      const existingStaff = {
        id: 'staff-1',
        email: 'staff@example.com',
        userType: UserType.STAFF,
        staffProfile: {
          id: 'profile-1',
          staffStatus: StaffStatus.ACTIVE,
          mfaEnabled: true,
        },
      };
      const tx = {
        user: {
          create: jest.fn(),
          update: jest.fn(),
        },
        staffProfile: {
          create: jest.fn(),
          update: jest.fn(),
        },
        userRole: {
          deleteMany: jest.fn(),
          createMany: jest.fn(),
        },
      };
      const prisma = {
        staffInvitation: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
        },
        role: {
          findMany: jest.fn().mockResolvedValue([{ id: 'role-1', slug: 'STAFF' }]),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(existingStaff),
        },
        $transaction: jest.fn((callback: (txClient: typeof tx) => Promise<void>) => callback(tx)),
      };
      const service = staffService(prisma);

      await expect(
        service.inviteStaff({ email: existingStaff.email, roleSlugs: ['STAFF'] }, 'admin-1'),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(tx.staffProfile.update).not.toHaveBeenCalled();
      expect(tx.userRole.deleteMany).not.toHaveBeenCalled();
      expect(prisma.staffInvitation.create).not.toHaveBeenCalled();
    });
  });

  describe('BackOfficeAuthGuard', () => {
    it('allows a customer identity that has active staff capability, MFA, and roles', async () => {
      const request: any = {
        cookies: { backOfficeSessionId: 'session-1' },
      };
      const guard = new BackOfficeAuthGuard({
        verifySession: jest.fn().mockResolvedValue({
          user: {
            id: 'user-1',
            userType: UserType.CUSTOMER,
            isActive: true,
            staffProfile: {
              staffStatus: StaffStatus.ACTIVE,
              mfaEnabled: true,
            },
            userRoles: [{ role: { slug: 'STAFF' } }],
          },
        }),
      } as any);

      await expect(guard.canActivate(context(request))).resolves.toBe(true);
      expect(request.user.userId).toBe('user-1');
    });

    it('blocks suspended staff capability even when a session exists', async () => {
      const guard = new BackOfficeAuthGuard({
        verifySession: jest.fn().mockResolvedValue({
          user: {
            id: 'user-1',
            userType: UserType.CUSTOMER,
            isActive: true,
            staffProfile: {
              staffStatus: StaffStatus.SUSPENDED,
              mfaEnabled: true,
            },
            userRoles: [{ role: { slug: 'STAFF' } }],
          },
        }),
      } as any);

      await expect(
        guard.canActivate(context({ cookies: { backOfficeSessionId: 'session-1' } })),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('blocks invited staff before MFA activation even when roles are already assigned', async () => {
      const guard = new BackOfficeAuthGuard({
        verifySession: jest.fn().mockResolvedValue({
          user: {
            id: 'user-1',
            userType: UserType.CUSTOMER,
            isActive: true,
            staffProfile: {
              staffStatus: StaffStatus.MFA_SETUP_REQUIRED,
              mfaEnabled: false,
            },
            userRoles: [{ role: { slug: 'STAFF' } }],
          },
        }),
      } as any);

      await expect(
        guard.canActivate(context({ cookies: { backOfficeSessionId: 'session-1' } })),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('BackOfficeAuthService.validateGoogleLogin', () => {
    it('requires a password credential before Google staff can enter back-office', async () => {
      const service = new BackOfficeAuthService(
        {
          user: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'user-1',
              email: 'customer@example.com',
              isActive: true,
              passwordHash: null,
              staffProfile: {
                staffStatus: StaffStatus.MFA_SETUP_REQUIRED,
                mfaEnabled: false,
              },
              oauthAccounts: [{ provider: 'GOOGLE' }],
              userRoles: [{ role: { slug: 'STAFF' } }],
            }),
          },
          oAuthAccount: {
            create: jest.fn(),
          },
        } as any,
        {} as any,
        {
          get: jest.fn((key: string) => {
            if (key === 'JWT_ACCESS_SECRET') return 'test-jwt-secret';
            if (key === 'GOOGLE_OAUTH_CLIENT_ID') return 'google-client-id';
            return undefined;
          }),
        } as any,
        { log: jest.fn() } as any,
        {
          getString: jest.fn().mockResolvedValue('5m'),
          getNumber: jest.fn().mockResolvedValue(300),
        } as any,
      );
      jest.spyOn(service, 'verifyGoogleIdToken').mockResolvedValue({
        email: 'customer@example.com',
        email_verified: true,
        sub: 'google-sub',
      } as any);

      await expect(service.validateGoogleLogin('id-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});

function staffService(prisma: any) {
  return new BackOfficeStaffService(
    prisma,
    { sendMail: jest.fn() } as any,
    { get: jest.fn().mockReturnValue('http://back-office.test') } as any,
    { log: jest.fn() } as any,
    { getNumber: jest.fn().mockResolvedValue(48) } as any,
  );
}

function context(request: any) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as any;
}
