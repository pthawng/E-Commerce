import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateCatalogProductDto } from './create-catalog-product.dto';

export class ImportCatalogDto {
  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCatalogProductDto)
  rows?: CreateCatalogProductDto[];
}
