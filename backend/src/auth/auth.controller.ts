import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor() {}
  @Get('status')
  @UseGuards(AuthGuard)
  getStatus() {
    return { message: 'User is authenticated' };
  }
}
