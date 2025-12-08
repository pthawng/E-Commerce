import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private storage: StorageService) {}

  // Upload 1 ảnh
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadOne(@UploadedFile() file: Express.Multer.File, @Body() body: { folder: string }) {
    const filename = `${Date.now()}-${file.originalname}`;
    const path = `${body.folder}/${filename}`;

    const url = await this.storage.upload(path, file);

    return { url, path };
  }

  // Upload nhiều ảnh
  @Post('multi-upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMany(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { folder: string },
  ) {
    const urls: string[] = [];

    for (const file of files) {
      const path = `${body.folder}/${Date.now()}-${file.originalname}`;
      const url = await this.storage.upload(path, file);
      urls.push(url);
    }

    return { urls };
  }
}
