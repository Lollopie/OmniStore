import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import express from 'express';
import { LoginService } from './login.service';
import { RegisterDto } from '../register/register.dto';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}
  @Post()
  @HttpCode(HttpStatus.OK)
  async register(
    @Body() user: RegisterDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const token = await this.loginService.login(user);
    res.cookie('token', token.Authorization, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1 * 60 * 60 * 1000, // Cookie expiry in milliseconds (e.g., 1 hour)
    });

    return { message: 'Authentication successful' };
  }
}
