import { Body, Controller, Get, Patch, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from '@modules/auth/guard/access-jwt.guard';
import { CurrentUserId } from '@common/decorators/get-user.decorator';
import { AuditLogInterceptor } from '@common/interceptors/audit-log.interceptor';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('User Profile')
@Controller('profile')
@UseGuards(JwtAccessGuard)
@UseInterceptors(AuditLogInterceptor)
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    async getMe(@CurrentUserId() userId: string) {
        return this.profileService.getMe(userId);
    }

    @Patch('update')
    @ApiOperation({ summary: 'Update current user profile' })
    async updateMe(
        @CurrentUserId() userId: string,
        @Body() dto: UpdateProfileDto,
    ) {
        return this.profileService.updateMe(userId, dto);
    }
}
