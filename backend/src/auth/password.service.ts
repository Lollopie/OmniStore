import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
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
}
