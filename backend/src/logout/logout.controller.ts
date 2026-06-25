import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import express from 'express';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('logout')
export class LogoutController {
  constructor() {}
  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  logout(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    res.cookie('token', req['user'], {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(1970, 1, 1),
    });

    return { message: 'Logout successful' };
  }
}
