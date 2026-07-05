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
import { ConfigService } from '@nestjs/config';

@Controller('login')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly configService: ConfigService,
  ) {}
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
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: this.configService.get<number>('auth.jwtExpiresIn')! * 1000,
    });

    return { message: 'Authentication successful' };
  }
}
