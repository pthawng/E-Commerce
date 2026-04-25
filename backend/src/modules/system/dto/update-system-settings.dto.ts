import { IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSystemSettingsDto {
    @ApiProperty({
        description: 'Map of setting keys to their values',
        example: { atelier_name: 'Ray Paradis Main Vault', base_currency: 'USD' },
    })
    @IsObject()
    @IsNotEmpty()
    settings: Record<string, any>;
}
