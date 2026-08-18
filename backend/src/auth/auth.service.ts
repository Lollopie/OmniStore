import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cookie } from '../user/user.decorator';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
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
  async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('auth.saltRounds');
    return await bcrypt.hash(password, saltRounds!);
  }
  async verifyPassword(
    password: string,
    correctPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, correctPassword);
  }
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
