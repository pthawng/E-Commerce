import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class UpdateSystemSettingsDto {
  @ApiProperty({
    description: 'Map of setting keys to their values',
    example: { atelier_name: 'Ray Paradis Main Vault', base_currency: 'USD' },
  })
  @IsObject()
  @IsNotEmpty()
  settings: Record<string, any>;
}
