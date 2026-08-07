import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import {
  PasswordResetContext,
  VerificationEmailContext,
} from './interfaces/mail-contexts.interface';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(
    to: string,
    context: VerificationEmailContext,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: 'Verify your email address',
      template: './verification',
      context,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    context: PasswordResetContext,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: 'Reset your password',
      template: './passwordReset',
      context,
    });
  }
}
