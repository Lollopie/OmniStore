import { Body, Controller, Post } from '@nestjs/common';
import { RegisterService } from './register.service';
import { RegisterDto } from '@shared/dto/register.dto';
import { Resend } from 'resend';
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
    if (process.env.NODE_ENV == 'prod') {
      const resend = new Resend(this.configService.get('email.resendSecret'));
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'f.piel@gmx.de',
        subject: 'Hello World',
        html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
      });
    }
    if (process.env.NODE_ENV == 'dev') {
      await this.mailService.sendVerificationEmail('example@example.org', {
        userName: user.username,
        verificationUrl: 'http://localhost:3000/verify-email',
        expiresInHours: 24,
      });
    }
    if (response) {
      return { success: true };
    }
    return { error: 'Register failed' };
  }
}
