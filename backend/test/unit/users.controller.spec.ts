import { UsersController } from '../../src/user/users.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { CanActivate } from '@nestjs/common';
import { AuthGuard } from '../../src/auth/auth.guard';
import { UsersService } from '../../src/user/users.service';
describe('UsersController', () => {
  let usersController: UsersController;
  const mockUsersService = {
    updatePassword: jest.fn(),
    deleteUser: jest.fn(),
  };
  class MockGuard implements CanActivate {
    canActivate(): boolean {
      return true;
    }
  }
  const mockUserToken = {
    username: 'username',
    userId: 'user-1',
    orgId: 'org-1',
    activeWarehouseId: 'warehouse-1',
    activeRole: 'staff',
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(MockGuard)
      .compile();

    usersController = module.get<UsersController>(UsersController);
  });
  it('should be defined', () => {
    expect(usersController).toBeDefined();
  });
  describe('updatePassword', () => {
    it('should call usersService updatePassword with userId and ChangePasswordDto', async () => {
      await usersController.updatePassword(
        {
          password: 'oldPassword',
          newPassword: 'newPassword',
          confirmPassword: 'newPassword',
        },
        mockUserToken,
      );
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith('user-1', {
        password: 'oldPassword',
        newPassword: 'newPassword',
        confirmPassword: 'newPassword',
      });
    });
    it('should return success message', async () => {
      const result = await usersController.updatePassword(
        {
          password: 'oldPassword',
          newPassword: 'newPassword',
          confirmPassword: 'newPassword',
        },
        mockUserToken,
      );
      expect(result).toEqual({
        message: 'Password updated successfully',
      });
    });
  });
  describe('deleteAccount', () => {
    it('should call usersService deleteAccount with userId and password', async () => {
      const mockResponse = {
        clearCookie: jest.fn(),
      };
      await usersController.deleteAccount(
        { password: 'password1' },
        mockUserToken,
        mockResponse,
      );
      expect(mockUsersService.deleteUser).toHaveBeenCalledWith(
        'user-1',
        'password1',
      );
    });
    it('should clear cookie', async () => {
      const mockResponse = {
        clearCookie: jest.fn(),
      };
      await usersController.deleteAccount(
        { password: 'password1' },
        mockUserToken,
        mockResponse,
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      });
    });
    it('should return success message', async () => {
      const mockResponse = {
        clearCookie: jest.fn(),
      };
      const result = await usersController.deleteAccount(
        { password: 'password1' },
        mockUserToken,
        mockResponse,
      );
      expect(result).toEqual({ message: 'Account deleted successfully' });
    });
  });
});
