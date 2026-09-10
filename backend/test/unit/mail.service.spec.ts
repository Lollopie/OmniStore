import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '../../src/mail/mail.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('MailService', () => {
  let mailService: MailService;
  const mockMailerService = {
    sendMail: jest.fn(),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });
  it('should be defined', () => {
    expect(mailService).toBeDefined();
  });
  describe('sendEmail', () => {
    it("should call nestjs mailerService with it's parameters", async () => {
      await mailService.sendEmail('to', 'subject', 'template', {
        key: 'value',
      });
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'to',
        subject: 'subject',
        template: 'template',
        context: {
          key: 'value',
        },
      });
    });
  });
  describe('sendVerificationEmail', () => {
    it("should call nestjs mailerService with it's parameters", async () => {
      await mailService.sendVerificationEmail('to', {
        verificationUrl: 'https://www.example.org',
        expiresInMinutes: 10,
      });
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'to',
        subject: 'Verify your email address',
        template: './verification',
        context: {
          verificationUrl: 'https://www.example.org',
          expiresInMinutes: 10,
        },
      });
    });
  });
  describe('sendPasswordResetEmail', () => {
    it("should call nestjs mailerService with it's parameters", async () => {
      await mailService.sendPasswordResetEmail('to', {
        username: 'username',
        resetUrl: 'https://www.example.org',
      });
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'to',
        subject: 'Reset your password',
        template: './passwordReset',
        context: {
          username: 'username',
          resetUrl: 'https://www.example.org',
        },
      });
    });
  });
  describe('sendInviteEmail', () => {
    it("should call nestjs mailerService with it's parameters", async () => {
      await mailService.sendInviteEmail('to', {
        organizationName: 'org',
        verificationUrl: 'https://www.example.org',
        expiresInHours: 1,
      });
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'to',
        subject: `You have been invited to org`,
        template: './invite',
        context: {
          organizationName: 'org',
          verificationUrl: 'https://www.example.org',
          expiresInHours: 1,
        },
      });
    });
  });
});
