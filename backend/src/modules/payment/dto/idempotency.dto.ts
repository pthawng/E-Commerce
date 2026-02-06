import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Idempotency Header Decorator
 * Extracts idempotency key from request header
 */
export const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';

/**
 * Base DTO with idempotency support
 */
export class IdempotentDto {
    @ApiProperty({
        description: 'Idempotency key to prevent duplicate operations',
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: false,
    })
    @IsString()
    @IsOptional()
    idempotencyKey?: string;
}
