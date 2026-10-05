import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {}

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
  generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
