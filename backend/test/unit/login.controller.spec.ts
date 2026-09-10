import { LoginController } from '../../src/login/login.controller';
import { Test } from '@nestjs/testing';
import { LoginService } from '../../src/login/login.service';
import { AuthService } from '../../src/auth/auth.service';
import { Response } from 'express';

describe('LoginController', () => {
  const mockLoginService = {
    login: jest.fn().mockResolvedValue([
      {
        user_id: 'user-1',
        username: 'username',
        org_id: 'org-1',
        org_role: 'member',
        warehouse_id: 'warehouse-1',
        warehouse_name: 'warehouse',
        warehouse_role: 'staff',
      },
    ]),
  };
  const mockAuthService = {
    createAndSendCookie: jest.fn().mockReturnValue({}),
  };
  let loginController: LoginController;
  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [LoginController],
      providers: [
        { provide: LoginService, useValue: mockLoginService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();
    loginController = moduleRef.get(LoginController);
  });
  it('should be defined', () => {
    expect(loginController).toBeDefined();
  });
  describe('login', () => {
    it('should return null if no warehouse is found', async () => {
      mockLoginService.login.mockResolvedValueOnce([
        {
          user_id: 'user-1',
          username: 'username',
          org_id: 'org-1',
          org_role: 'member',
          warehouse_id: null,
          warehouse_name: null,
          warehouse_role: null,
        },
      ]);
      const mockResponse = {} as unknown as Response;
      const response = await loginController.login(
        {
          username: 'username',
          password: 'password1',
        },
        mockResponse,
      );
      expect(response).toMatchObject({
        activeWarehouse: null,
        activeRole: null,
        warehouses: [],
      });
    });
    it('should call authService createAndSendCookie with correct parameters', async () => {
      const mockResponse = {} as unknown as Response;
      await loginController.login(
        {
          username: 'username',
          password: 'password1',
        },
        mockResponse,
      );
      expect(mockAuthService.createAndSendCookie).toHaveBeenCalledWith(
        {
          userId: 'user-1',
          username: 'username',
          orgId: 'org-1',
          activeWarehouseId: 'warehouse-1',
          activeRole: 'staff',
        },
        mockResponse,
      );
    });
    it('should return expected values', async () => {
      const mockResponse = {} as unknown as Response;
      const response = await loginController.login(
        {
          username: 'username',
          password: 'password1',
        },
        mockResponse,
      );
      expect(response).toMatchObject({
        message: 'Authentication successful',
        orgId: 'org-1',
        orgRole: 'member',
        warehouses: [
          {
            warehouseId: 'warehouse-1',
            name: 'warehouse',
            role: 'staff',
          },
        ],
        activeWarehouse: 'warehouse-1',
        activeRole: 'staff',
        userId: 'user-1',
        username: 'username',
      });
    });
  });
});
