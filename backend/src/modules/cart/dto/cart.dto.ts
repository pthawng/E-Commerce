import { IsInt, IsNotEmpty, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
    @ApiProperty({ description: 'Product Variant ID' })
    @IsUUID(4, { message: 'Invalid Variant ID' })
    @IsNotEmpty()
    variantId: string;

    @ApiProperty({ description: 'Purchase quantity', default: 1, minimum: 1, maximum: 99 })
    @IsInt({ message: 'Quantity must be an integer' })
    @Min(1, { message: 'Minimum quantity is 1' })
    @Max(99, { message: 'Max quantity per add is 99' })
    quantity: number;
}

export class UpdateCartItemDto {
    @ApiProperty({ description: 'New quantity (0 to remove)', minimum: 0, maximum: 999 })
    @IsInt()
    @Min(0)
    @Max(999)
    quantity: number;
}

export class RefreshCartDto {
    // Empty DTO for explicit refresh action
}
