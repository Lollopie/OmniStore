import { LogoutController } from '../../src/logout/logout.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
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
      const mockResponse = {
        clearCookie: jest.fn(),
      } as unknown as Response;
      logoutController.logout(mockResponse);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      });
    });
    it('should return message', () => {
      const mockResponse = {
        clearCookie: jest.fn(),
      } as unknown as Response;
      const response = logoutController.logout(mockResponse);
      expect(response).toEqual({ message: 'Logout successful' });
    });
  });
});
