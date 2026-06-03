import { SystemSettingService } from '@modules/system/system-setting.service';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { OAuthProvider, StaffStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { NobleCryptoPlugin, ScureBase32Plugin, TOTP } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from 'src/prisma/prisma.service';
import { BackOfficeAuditLogService } from './back-office-audit-log.service';

const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
});

const ARGON_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  timeCost: 2,
  memoryCost: 19456,
  parallelism: 1,
};

@Injectable()
export class BackOfficeAuthService {
  private readonly logger = new Logger(BackOfficeAuthService.name);
  private readonly googleClient: OAuth2Client;
  private readonly mfaEncryptionKey: Buffer;
  private readonly mfaTempTokenSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogService: BackOfficeAuditLogService,
    private readonly settings: SystemSettingService,
  ) {
    const googleClientId = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    this.googleClient = new OAuth2Client(googleClientId);

    const rawKey = this.getSecuritySecret('MFA_ENCRYPTION_KEY', 'JWT_ACCESS_SECRET');
    this.mfaEncryptionKey = createHash('sha256').update(rawKey).digest();
    this.mfaTempTokenSecret = this.getSecuritySecret(
      'BACK_OFFICE_MFA_JWT_SECRET',
      'JWT_ACCESS_SECRET',
    );
  }

  private getSecuritySecret(primaryKey: string, devFallbackKey: string): string {
    const primaryValue = this.configService.get<string>(primaryKey);
    if (primaryValue) return primaryValue;

    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new Error(`${primaryKey} is required in production`);
    }

    const fallbackValue = this.configService.get<string>(devFallbackKey);
    if (!fallbackValue) {
      throw new Error(`${primaryKey} or ${devFallbackKey} must be configured`);
    }

    this.logger.warn(
      `${primaryKey} is not configured; using ${devFallbackKey} for non-production only.`,
    );
    return fallbackValue;
  }

  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', this.mfaEncryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !encrypted) {
      throw new Error('Định dạng mã hóa không hợp lệ');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', this.mfaEncryptionKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async validateCredentials(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        staffProfile: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.staffProfile) {
      throw new UnauthorizedException(
        'Thông tin đăng nhập không chính xác hoặc bạn không có quyền truy cập back-office.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa.');
    }

    const { staffStatus } = user.staffProfile;
    if (staffStatus === StaffStatus.SUSPENDED || staffStatus === StaffStatus.DISABLED) {
      throw new UnauthorizedException('Quyền truy cập quản trị của bạn đã bị vô hiệu hóa.');
    }

    if (user.userRoles.length === 0) {
      throw new UnauthorizedException('Tài khoản không có vai trò back-office hợp lệ.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Tài khoản chưa được thiết lập mật khẩu. Vui lòng kiểm tra email kích hoạt.',
      );
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác.');
    }

    return user;
  }

  async verifyGoogleIdToken(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new BadRequestException('Không thể lấy email từ Google ID Token.');
      }
      if (!payload.email_verified) {
        throw new BadRequestException('Email Google chưa được xác minh.');
      }
      return payload;
    } catch (error) {
      throw new UnauthorizedException(`Xác thực Google thất bại: ${error.message}`);
    }
  }

  async validateGoogleLogin(idToken: string) {
    const payload = await this.verifyGoogleIdToken(idToken);
    if (!payload.email) {
      throw new UnauthorizedException('Không thể xác định email từ tài khoản Google.');
    }
    const email = payload.email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        staffProfile: true,
        oauthAccounts: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.staffProfile) {
      throw new UnauthorizedException('Tài khoản Google này không có quyền truy cập back-office.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa.');
    }

    const { staffStatus } = user.staffProfile;
    if (staffStatus === StaffStatus.SUSPENDED || staffStatus === StaffStatus.DISABLED) {
      throw new UnauthorizedException('Quyền truy cập quản trị của bạn đã bị vô hiệu hóa.');
    }

    if (user.userRoles.length === 0) {
      throw new UnauthorizedException('Tài khoản không có vai trò back-office hợp lệ.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Tài khoản chưa được thiết lập mật khẩu back-office.');
    }

    // Link Google OAuth account if not already linked
    const googleAccount = user.oauthAccounts.find((acc) => acc.provider === OAuthProvider.GOOGLE);
    if (!googleAccount) {
      await this.prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: OAuthProvider.GOOGLE,
          providerAccountId: payload.sub,
          email,
          emailVerified: true,
          displayName: payload.name,
          avatarUrl: payload.picture,
        },
      });
    }

    return user;
  }

  async generateMfaTempToken(
    userId: string,
    purpose: 'mfa_challenge' | 'mfa_setup',
  ): Promise<string> {
    const expiresIn = (await this.settings.getString('auth.mfa.tempTokenTtl')) as NonNullable<
      JwtSignOptions['expiresIn']
    >;
    return this.jwtService.sign(
      { sub: userId, purpose },
      { secret: this.mfaTempTokenSecret, expiresIn },
    );
  }

  verifyMfaTempToken(token: string, expectedPurpose: 'mfa_challenge' | 'mfa_setup'): string {
    try {
      const payload = this.jwtService.verify(token, { secret: this.mfaTempTokenSecret });
      if (payload.purpose !== expectedPurpose) {
        throw new UnauthorizedException('Mã xác thực tạm thời không hợp lệ.');
      }
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Mã xác thực tạm thời đã hết hạn hoặc không hợp lệ.');
    }
  }

  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản.');
    }

    const secret = totp.generateSecret();
    const otpauth = totp.toURI({ label: user.email, issuer: 'Ray Paradis', secret });
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    // Save encrypted secret temporarily
    const encryptedSecret = this.encrypt(secret);
    await this.prisma.staffProfile.update({
      where: { userId },
      data: {
        mfaSecretEncrypted: encryptedSecret,
      },
    });

    return { qrCodeUrl, secret };
  }

  async verifyMfaSetup(userId: string, code: string): Promise<string[]> {
    const profile = await this.prisma.staffProfile.findUnique({
      where: { userId },
    });

    if (!profile || !profile.mfaSecretEncrypted) {
      throw new BadRequestException('MFA chưa được thiết lập.');
    }

    const secret = this.decrypt(profile.mfaSecretEncrypted);
    const epochTolerance = await this.settings.getNumber('auth.mfa.totpWindowSeconds');
    const result = await totp.verify(code, { secret, epochTolerance } as any);
    const isValid = result.valid;

    if (!isValid) {
      throw new BadRequestException('Mã xác thực TOTP không chính xác.');
    }

    // Generate 8 recovery codes
    const recoveryCodes: string[] = [];
    const hashedRecoveryCodes: string[] = [];

    for (let i = 0; i < 8; i++) {
      const rawCode = randomBytes(4).toString('hex'); // 8 characters
      recoveryCodes.push(rawCode);
      const hashedCode = await argon2.hash(rawCode, ARGON_OPTIONS);
      hashedRecoveryCodes.push(hashedCode);
    }

    await this.prisma.staffProfile.update({
      where: { userId },
      data: {
        mfaEnabled: true,
        staffStatus: StaffStatus.ACTIVE,
        mfaRecoveryCodes: JSON.stringify(hashedRecoveryCodes),
      },
    });

    await this.auditLogService.log({
      actorUserId: userId,
      action: 'MFA_ENABLE',
      resource: 'StaffProfile',
      resourceId: profile.id,
    });

    return recoveryCodes;
  }

  async verifyMfaCode(userId: string, code: string): Promise<boolean> {
    const profile = await this.prisma.staffProfile.findUnique({
      where: { userId },
    });

    if (!profile || !profile.mfaEnabled || !profile.mfaSecretEncrypted) {
      return false;
    }

    const secret = this.decrypt(profile.mfaSecretEncrypted);
    const epochTolerance = await this.settings.getNumber('auth.mfa.totpWindowSeconds');
    const result = await totp.verify(code, { secret, epochTolerance } as any);
    return result.valid;
  }

  async verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
    const profile = await this.prisma.staffProfile.findUnique({
      where: { userId },
    });

    if (!profile || !profile.mfaRecoveryCodes) {
      return false;
    }

    const hashedCodes: string[] = JSON.parse(profile.mfaRecoveryCodes);
    let matchedIndex = -1;

    for (let i = 0; i < hashedCodes.length; i++) {
      const match = await argon2.verify(hashedCodes[i], code);
      if (match) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex === -1) {
      return false;
    }

    // Remove the used recovery code
    hashedCodes.splice(matchedIndex, 1);

    await this.prisma.staffProfile.update({
      where: { userId },
      data: {
        mfaRecoveryCodes: JSON.stringify(hashedCodes),
      },
    });

    await this.auditLogService.log({
      actorUserId: userId,
      action: 'MFA_RECOVERY_CODE_USE',
      resource: 'StaffProfile',
      resourceId: profile.id,
      newValue: `Remaining: ${hashedCodes.length}`,
    });

    return true;
  }
}
