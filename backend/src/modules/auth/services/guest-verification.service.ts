import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { MailService } from '../../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GuestVerificationService {
    private readonly logger = new Logger(GuestVerificationService.name);
    private readonly OTP_TTL = 300; // 5 minutes in seconds
    private readonly TOKEN_TTL = '15m';

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly mailService: MailService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Generates and sends a 6-digit OTP to the guest email.
     */
    async sendOTP(email: string): Promise<void> {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const cacheKey = `guest_otp:${email}`;

        // Rate limiting: check if OTP was recently sent (optional but L8 standard)
        const existing = await this.cacheManager.get(cacheKey);
        if (existing) {
            this.logger.warn(`OTP already sent to ${email}, ignoring request.`);
            return; // Or throw Conflict
        }

        await this.cacheManager.set(cacheKey, otp, this.OTP_TTL * 1000);

        await this.mailService.sendMail({
            to: email,
            subject: 'Mã xác thực đặt hàng - Ray Paradis',
            template: 'guest-otp',
            context: {
                otp,
                expiryMinutes: 5,
                companyName: this.configService.get('COMPANY_NAME') || 'Ray Paradis',
                currentYear: new Date().getFullYear(),
            },
        });

        this.logger.log(`OTP ${otp} sent to guest ${email}`);
    }

    /**
     * Verifies the OTP and returns a signed verification token.
     */
    async verifyOTP(email: string, code: string): Promise<{ guestVerifyToken: string }> {
        const cacheKey = `guest_otp:${email}`;
        const storedOtp = await this.cacheManager.get<string>(cacheKey);

        if (!storedOtp || storedOtp !== code) {
            throw new BadRequestException('Mã xác thực không chính xác hoặc đã hết hạn.');
        }

        // Clear OTP after success
        await this.cacheManager.del(cacheKey);

        // Issue a signed token to prove verification at checkout
        const payload = {
            email,
            type: 'guest_verify',
            iat: Math.floor(Date.now() / 1000),
        };

        const guestVerifyToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_CHECKOUT_SECRET'),
            expiresIn: this.TOKEN_TTL,
        });

        return { guestVerifyToken };
    }

    /**
     * Helper to verify the token during order creation.
     */
    async validateVerifyToken(email: string, token: string): Promise<void> {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_CHECKOUT_SECRET'),
            });

            if (payload.type !== 'guest_verify' || payload.email !== email) {
                throw new Error('Verification token mismatch');
            }
        } catch (error) {
            throw new BadRequestException('Email guest chưa được xác thực hoặc token không hợp lệ.');
        }
    }
}
