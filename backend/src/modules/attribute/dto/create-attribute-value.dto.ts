import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateAttributeValueDto {
  @IsNotEmpty()
  @IsObject()
  value: Record<string, string>;

  @IsOptional()
  @IsString()
  metaValue?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

