import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { RegisterService } from './register.service';
import { RegisterEmailDto } from '@shared/dto/register.dto';
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
  async register(@Body() user: RegisterEmailDto) {
    const response = await this.registerService.register(user);
    if (!response) {
      return { error: 'Register failed' };
    }
    await this.mailService.sendVerificationEmail(user.email, {
      verificationUrl:
        `${this.configService.get<string>('app.frontendUrl')}/register/verify?token=` +
        response.rawToken,
      expiresInMinutes:
        this.configService.get<number>('email.registerTokenExpiresIn') || 30,
    });
    return {
      message:
        'Registration successful! Please check your email for further instructions.',
    };
  }
  @Get('verify')
  async verifyToken(@Query('token') inviteToken: string) {
    if (!inviteToken) {
      throw new BadRequestException('Invite token is required');
    }
    const invite = await this.registerService.verifyToken(inviteToken);
    if (!invite) {
      throw new BadRequestException('Invalid or expired invite token');
    }
    if (invite.expiresAt < new Date()) {
      return {
        error: 'Invite token has expired. Please request a new invite.',
      };
    }
    return {
      valid: true,
      email: invite.email,
    };
  }
}
