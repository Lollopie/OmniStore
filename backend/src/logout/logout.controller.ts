import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import express from 'express';

@Controller('logout')
export class LogoutController {
  constructor() {}
  @Post()
  @HttpCode(HttpStatus.OK)
  logout(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    if (
      !req.cookies ||
      !req.cookies['token'] ||
      typeof req.cookies['token'] !== 'string'
    ) {
      return { message: 'No token provided' };
    }
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return { message: 'Logout successful' };
  }
}
