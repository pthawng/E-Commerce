import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { AttributeInputType } from 'src/generated/prisma/client';

export class CreateAttributeDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsObject()
  name: Record<string, string>;

  @IsOptional()
  @IsEnum(AttributeInputType)
  filterType?: AttributeInputType;
}

