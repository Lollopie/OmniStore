import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import express from 'express';
import { SessionService } from '../auth/session.service';

@Controller('logout')
export class LogoutController {
  constructor(private readonly sessionService: SessionService) {}
  @Post()
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    // Only this device's session ends; other devices stay signed in
    await this.sessionService.endSession(req, res);

    return { message: 'Logout successful' };
  }
}
