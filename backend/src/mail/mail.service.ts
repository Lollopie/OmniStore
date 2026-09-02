import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import {
  InviteContext,
  PasswordResetContext,
  VerificationEmailContext,
} from './interfaces/mail-contexts.interface';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}
  async sendEmail(
    to: string,
    subject: string,
    template: string,
    context: {
      [name: string]: any;
    },
  ): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject,
      template,
      context,
    });
  }
  async sendVerificationEmail(
    to: string,
    context: VerificationEmailContext,
  ): Promise<void> {
    await this.sendEmail(
      to,
      'Verify your email address',
      './verification',
      context,
    );
  }

  async sendPasswordResetEmail(
    to: string,
    context: PasswordResetContext,
  ): Promise<void> {
    await this.sendEmail(to, 'Reset your password', './passwordReset', context);
  }
  async sendInviteEmail(to: string, context: InviteContext): Promise<void> {
    await this.sendEmail(
      to,
      `You have been invited to \`${context.organizationName}\``,
      './invite',
      context,
    );
  }
}
