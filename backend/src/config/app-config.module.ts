import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnv } from './env.validator';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // NestJS ConfigModule still loads the files, but we enforce validation via our own schema
      validate: (config) => validateEnv(),
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class AppConfigModule {}
