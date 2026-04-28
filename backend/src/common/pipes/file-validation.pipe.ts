import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface FileValidationOptions {
  maxSizeMb?: number;
  allowedMimeTypes?: string[];
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly maxSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(options?: FileValidationOptions) {
    this.maxSize = (options?.maxSizeMb || 5) * 1024 * 1024; // Default 5MB
    this.allowedMimeTypes = options?.allowedMimeTypes || [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
    ];
  }

  transform(value: any) {
    if (!value) return value;

    // Handle both single file and array of files
    const files: Express.Multer.File[] = Array.isArray(value) ? value : [value];

    for (const file of files) {
      if (file.size > this.maxSize) {
        throw new BadRequestException(
          `Kích thước file ${file.originalname} vượt quá giới hạn ${this.maxSize / (1024 * 1024)}MB`,
        );
      }

      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Định dạng file ${file.originalname} (${file.mimetype}) không được hỗ trợ. Chỉ hỗ trợ: ${this.allowedMimeTypes.join(', ')}`,
        );
      }
    }

    return value;
  }
}
