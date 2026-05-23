import { sanitizeUser } from '@modules/auth/sanitize/user.sanitize';
import { UserService } from '@modules/user/user.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return sanitizeUser(user);
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    // Delegate to UserService to ensure consistency in validation (email/phone uniqueness)
    const updatedUser = await this.userService.update(userId, {
      fullName: dto.fullName,
      nickName: dto.nickName,
      phone: dto.phone,
      email: dto.email,
      bio: dto.bio,
      avatarUrl: dto.avatarUrl,
    });

    this.logger.log(`User profile updated via unified UserService for ID: ${userId}`);
    // sanitizeUser is already handled by UserService.update returning UserResponseDto (which is simplified)
    // but to match previous return type expectations, we use the raw result or ensure sanitizeUser is applied.
    return updatedUser;
  }
}
