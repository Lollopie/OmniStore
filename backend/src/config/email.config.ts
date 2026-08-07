import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  mailHost: process.env.MAIL_HOST || 'localhost',
  mailPort: parseInt(process.env.MAIL_PORT!, 10) || 1025,
  mailSecure: process.env.MAIL_SECURE === 'true',
  mailUser: process.env.MAIL_USER || '',
  mailPassword: process.env.MAIL_PASS || '',
  mailFrom: process.env.MAIL_FROM || 'No Reply <noreply@localhost>',
  resendSecret: process.env.RESEND_SECRET || 'resendSecret',
}));
