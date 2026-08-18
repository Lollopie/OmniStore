import { Body, Controller, Post } from '@nestjs/common';
import { RegisterService } from './register.service';
import { RegisterDto } from '@shared/dto/register.dto';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
@Controller('register')
export class RegisterController {
  constructor(
    private readonly registerService: RegisterService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}
  @Post()
  async register(@Body() user: RegisterDto) {
    const response = await this.registerService.register(user);
    if (response) {
      return { success: true };
    }
    await this.mailService.sendVerificationEmail('example@example.org', {
      userName: user.username,
      verificationUrl: 'http://localhost:3000/verify-email',
      expiresInHours: 24,
    });
    return { error: 'Register failed' };
  }
}
