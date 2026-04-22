import { Public } from '@common/decorators/public.decorator';
import { Controller, Get, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';
import { HealthService } from './health.service';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Public()
  @Get()
  async getHealth(@Res() res: Response) {
    const health = await this.healthService.check();
    if (health.status === 'ok') {
      return res.status(200).json(health);
    }
    return res.status(503).json(health);
  }
}
