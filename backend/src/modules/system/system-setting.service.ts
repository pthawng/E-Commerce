import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SystemSettingService {
    private readonly logger = new Logger(SystemSettingService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Lấy tất cả cài đặt hệ thống dưới dạng Key-Value map
     */
    async getAllSettings(): Promise<Record<string, any>> {
        const settings = await this.prisma.systemSetting.findMany();
        return settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    }

    /**
     * Cập nhật hàng loạt cài đặt hệ thống (Atomic Transaction)
     */
    async updateSettings(settings: Record<string, any>, userId?: string) {
        const entries = Object.entries(settings);

        await this.prisma.$transaction(
            entries.map(([key, value]) =>
                this.prisma.systemSetting.upsert({
                    where: { key },
                    update: {
                        value,
                        updatedBy: userId,
                    },
                    create: {
                        key,
                        value,
                        updatedBy: userId,
                    },
                }),
            ),
        );

        this.logger.log(`System settings updated by user ${userId || 'system'}`);
        return { success: true, message: 'Settings updated successfully' };
    }
}
