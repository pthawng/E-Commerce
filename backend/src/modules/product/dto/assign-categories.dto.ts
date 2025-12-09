import { IsArray, IsUUID } from 'class-validator';

export class AssignCategoriesDto {
  @IsArray()
  @IsUUID('all', { each: true })
  categoryIds: string[];
}
