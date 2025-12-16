import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { UpdateAttributeValueDto } from './update-attribute-value.dto';

export class AttributeValueUpsertDto extends PartialType(UpdateAttributeValueDto) {
  /** If provided, will update this value; if omitted, will create a new value */
  @IsOptional()
  @IsString()
  id?: string;
}
