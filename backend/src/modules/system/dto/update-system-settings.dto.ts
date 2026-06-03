import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSystemSettingsDto {
  @ApiProperty({
    description: 'Map of setting keys to their values',
    example: { 'auth.session.backOfficeTtlHours': 12, 'order.paymentTimeoutMinutes': 15 },
  })
  @IsObject()
  @IsNotEmpty()
  settings: Record<string, unknown>;

  @ApiProperty({
    description: 'Reason for the setting update, stored in the audit trail',
    required: false,
    example: 'Increase payment timeout for holiday traffic',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
