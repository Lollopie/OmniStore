import { Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import express from 'express';

@Controller('logout')
export class LogoutController {
  constructor() {}
  @Post()
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: express.Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return { message: 'Logout successful' };
  }
}
