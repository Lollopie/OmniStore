import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cookie } from '../user/user.decorator';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class CookieService {
  constructor(
    private configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  createAndSendCookie(cookie: Cookie, response: Response) {
    const token = this.jwtService.sign(cookie);
    response.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: this.configService.get<number>('auth.jwtExpiresIn')! * 1000,
    });
  }
}
