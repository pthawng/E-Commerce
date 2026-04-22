import { Global, Module } from '@nestjs/common';
import { ResilientHttpClient } from './services/resilient-http.client';

@Global()
@Module({
  providers: [ResilientHttpClient],
  exports: [ResilientHttpClient],
})
export class CommonModule {}
