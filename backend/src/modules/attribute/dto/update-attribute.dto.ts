import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateAttributeDto } from './create-attribute.dto';
import { AttributeValueUpsertDto } from './upsert-attribute-value.dto';

// Omit `values` from base so we can redefine it with upsert DTO
export class UpdateAttributeDto extends PartialType(
  OmitType(CreateAttributeDto, ['values'] as const),
) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeValueUpsertDto)
  values?: AttributeValueUpsertDto[];
}
