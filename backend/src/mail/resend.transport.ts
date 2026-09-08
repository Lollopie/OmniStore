import { Resend } from 'resend';
import MailMessage from 'nodemailer/lib/mailer/mail-message';

export class ResendTransport<T = any> {
  name = 'ResendTransport';
  version = '1.0.0';
  private resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async send(
    mail: MailMessage<T>,
    callback: (err: Error | null, info?: any) => void,
  ) {
    try {
      const data = mail.data;
      if (
        !data.from ||
        typeof data.from !== 'string' ||
        !data.to ||
        typeof data.to !== 'string' ||
        !data.subject ||
        typeof data.subject !== 'string' ||
        (!data.html && !data.text) ||
        typeof data.html !== 'string'
      ) {
        return callback(new Error('Missing required email fields'));
      }
      const result = await this.resend.emails.send({
        from: data.from,
        to: Array.isArray(data.to) ? data.to : [data.to],
        subject: data.subject,
        html: data.html,
      });

      if (result.error) {
        return callback(new Error(result.error.message));
      }
      callback(null, {
        messageId: result.data?.id,
        envelope: {},
        accepted: [data.to],
        rejected: [],
      });
    } catch (err) {
      callback(err as Error);
    }
  }
}
