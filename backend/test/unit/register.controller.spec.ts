import { RegisterController } from '../../src/register/register.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { RegisterService } from '../../src/register/register.service';
import { MailService } from '../../src/mail/mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from '../../src/config/app.config';
import emailConfig from '../../src/config/email.config';
describe('RegisterController', () => {
  let registerController: RegisterController;
  let configService: ConfigService;
  const mockRegisterService = {
    register: jest.fn().mockResolvedValue({
      invite: {
        invite_id: 'invite-1',
        email: 'example@example.org',
        org_id: 'org-1',
        warehouse_id: 'warehouse-1',
        role: 'member',
        token_hash: 'mocked-hashed-token',
        expires_at: new Date(Date.now() + 1000 * 60 * 60),
      },
      rawToken: 'mocked-raw-token',
    }),
  };
  const mockMailService = {
    sendVerificationEmail: jest.fn(),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegisterController],
      providers: [
        { provide: RegisterService, useValue: mockRegisterService },
        { provide: MailService, useValue: mockMailService },
      ],
      imports: [
        await ConfigModule.forRoot({
          envFilePath: [`.env`, `.env.${process.env.NODE_ENV || 'test'}`],
          load: [appConfig, emailConfig],
        }),
      ],
    }).compile();

    registerController = module.get<RegisterController>(RegisterController);
    configService = module.get(ConfigService);
  });
  it('should be defined', () => {
    expect(registerController).toBeDefined();
  });
  describe('register', () => {
    it('should throw an error if registration failed', async () => {
      mockRegisterService.register.mockResolvedValueOnce(null);
      const result = await registerController.register({
        email: 'example@example.org',
      });
      expect(result).toEqual({ error: 'Register failed' });
    });
    it('should call mailService with expected values', async () => {
      await registerController.register({
        email: 'example@example.org',
      });
      const targetURL = configService.get<string>('app.frontendUrl');
      const expiresInMinutes =
        configService.get<number>('email.registerTokenExpiresIn') || 30;
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalledWith(
        'example@example.org',
        {
          verificationUrl:
            targetURL + '/register/verify?token=mocked-raw-token',
          expiresInMinutes,
        },
      );
    });
    it('should return success message', async () => {
      const response = await registerController.register({
        email: 'example@example.org',
      });
      expect(response).toEqual({
        message:
          'Registration successful! Please check your email for further instructions.',
      });
    });
  });
});
