import { LogoutController } from '../../src/logout/logout.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { SessionService } from '../../src/auth/session.service';
describe('LogoutController', () => {
  let logoutController: LogoutController;
  const mockSessionService = {
    endSession: jest.fn(),
  };
  const mockRequest = {} as unknown as Request;
  const mockResponse = {} as unknown as Response;
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogoutController],
      providers: [{ provide: SessionService, useValue: mockSessionService }],
    }).compile();

    logoutController = module.get<LogoutController>(LogoutController);
  });
  it('should be defined', () => {
    expect(logoutController).toBeDefined();
  });
  describe('logout', () => {
    it('should end the session of this device', async () => {
      await logoutController.logout(mockRequest, mockResponse);
      expect(mockSessionService.endSession).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
      );
    });
    it('should return message', async () => {
      const response = await logoutController.logout(mockRequest, mockResponse);
      expect(response).toEqual({ message: 'Logout successful' });
    });
  });
});
