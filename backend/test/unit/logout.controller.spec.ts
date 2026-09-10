import { LogoutController } from '../../src/logout/logout.controller';
import { Test, TestingModule } from '@nestjs/testing';
describe('LogoutController', () => {
  let logoutController: LogoutController;
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogoutController],
    }).compile();

    logoutController = module.get<LogoutController>(LogoutController);
  });
  it('should be defined', () => {
    expect(logoutController).toBeDefined();
  });
  describe('logout', () => {
    it('should set clearCookie with expected parameters', () => {
      const mockResponse: any = {
        clearCookie: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      logoutController.logout(mockResponse);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      });
    });
    it('should return message', () => {
      const mockResponse: any = {
        clearCookie: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = logoutController.logout(mockResponse);
      expect(response).toEqual({ message: 'Logout successful' });
    });
  });
});
