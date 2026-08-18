import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import {
  InviteContext,
  PasswordResetContext,
  VerificationEmailContext,
} from './interfaces/mail-contexts.interface';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}
  async sendEmail(
    to: string,
    subject: string,
    template: string,
    context: {
      [name: string]: any;
    },
  ): Promise<void> {
    if (process.env.NODE_ENV == 'prod') {
      const resend = new Resend(this.configService.get('email.resendSecret'));
      //TODO: Figure out how to send emails with resend and templates
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: to,
        subject: subject,
        html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
      });
    }
    if (process.env.NODE_ENV == 'dev') {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });
    }
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
