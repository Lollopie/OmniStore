import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
@Controller('healthz')
export class HealthController {
  constructor() {}
  @SkipThrottle()
  @Get()
  getHealth() {
    return { status: 'ok' };
  }
}
