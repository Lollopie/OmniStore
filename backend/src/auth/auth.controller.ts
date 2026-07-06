import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor() {}
  @SkipThrottle()
  @Get('status')
  @UseGuards(AuthGuard)
  getStatus() {
    return { message: 'User is authenticated' };
  }
}
