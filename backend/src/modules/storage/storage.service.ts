import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const bucket = this.configService.get<string>('SUPABASE_BUCKET');

    if (!url || !serviceKey || !bucket) {
      throw new InternalServerErrorException(
        'Supabase env vars are missing (URL/SERVICE_KEY/BUCKET)',
      );
    }

    this.bucket = bucket;
    this.client = createClient(url, serviceKey);
  }

  // Upload buffer
  async upload(path: string, file: Express.Multer.File) {
    const { error } = await this.client.storage.from(this.bucket).upload(path, file.buffer, {
      upsert: true,
      contentType: file.mimetype,
    });

    if (error) throw error;

    // trả signed URL nếu bucket private
    return this.getPublicUrl(path);
  }

  // Generate public URL (hoặc signed)
  getPublicUrl(path: string) {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);

    return data.publicUrl;
  }

  // Signed URL
  async getSignedUrl(path: string, expiresInSec = 3600) {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresInSec);

    if (error) throw error;

    return data.signedUrl;
  }

  // Delete file
  async delete(path: string) {
    const { error } = await this.client.storage.from(this.bucket).remove([path]);

    if (error) throw error;

    return true;
  }
}
