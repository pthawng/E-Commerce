import { PartialType } from '@nestjs/swagger';
import { CreateCatalogProductDto } from './create-catalog-product.dto';

export class UpdateCatalogProductDto extends PartialType(CreateCatalogProductDto) {}
