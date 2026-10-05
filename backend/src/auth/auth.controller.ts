import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import express from 'express';
import { AuthGuard } from './auth.guard';
import { SkipThrottle } from '@nestjs/throttler';
import { SessionService } from './session.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly sessionService: SessionService) {}
  @SkipThrottle()
  @Get('status')
  @UseGuards(AuthGuard)
  getStatus() {
    return { message: 'User is authenticated' };
  }
  // Runs without AuthGuard: the access token is usually expired by now
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    await this.sessionService.refresh(req, res);
    return { message: 'Session refreshed' };
  }
}
