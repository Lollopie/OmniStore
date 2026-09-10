import { OrganizationController } from '../../src/organization/organization.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../../src/auth/auth.guard';
import { CanActivate } from '@nestjs/common';
import { OrganizationRolesGuard } from '../../src/roles/organizationRoles/organizationRoles.guard';
import { OrganizationService } from '../../src/organization/organization.service';
import { AuthService } from '../../src/auth/auth.service';
import { UserOrganizationRoleService } from '../../src/userOrganizationRole/userOrganizationRole.service';
describe('OrganizationController', () => {
  let organizationController: OrganizationController;
  class MockGuard implements CanActivate {
    canActivate(): boolean {
      return true;
    }
  }
  const mockOrganizationService = {
    createOrganization: jest.fn().mockResolvedValue({
      user: {
        userId: 'user-1',
        email: 'example@example.org',
        username: 'username',
        password: 'password1',
      },
      organization: {
        orgId: 'org-1',
        name: 'organization',
        createdAt: new Date(),
      },
    }),
    getUsers: jest.fn().mockResolvedValue({
      data: {
        userId: 'user-1',
        username: 'username',
        role: 'staff',
      },
      total: 1,
    }),
  };
  const mockAuthService = {
    createAndSendCookie: jest.fn(),
  };
  const mockUserOrganizationRoleService = {
    updateUserRole: jest.fn().mockResolvedValue({
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'admin',
    }),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        {
          provide: OrganizationService,
          useValue: mockOrganizationService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UserOrganizationRoleService,
          useValue: mockUserOrganizationRoleService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockGuard)
      .overrideGuard(OrganizationRolesGuard)
      .useClass(MockGuard)
      .compile();

    organizationController = module.get<OrganizationController>(
      OrganizationController,
    );
  });
  it('should be defined', () => {
    expect(organizationController).toBeDefined();
  });
  describe('register', () => {
    it('should call organizationService createOrganization', async () => {
      const mockResponse: any = {};
      await organizationController.register(
        'token',
        {
          name: 'organizationName',
          ownerEmail: 'example@example.org',
          ownerUsername: 'username',
          ownerPassword: 'password1',
        },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        mockResponse,
      );
      expect(mockOrganizationService.createOrganization).toHaveBeenCalledWith(
        'token',
        {
          name: 'organizationName',
          ownerEmail: 'example@example.org',
          ownerUsername: 'username',
          ownerPassword: 'password1',
        },
      );
    });
    it('should call authService createAndSendCookie', async () => {
      const mockResponse: any = {};
      await organizationController.register(
        'token',
        {
          name: 'organizationName',
          ownerEmail: 'example@example.org',
          ownerUsername: 'username',
          ownerPassword: 'password1',
        },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        mockResponse,
      );
      expect(mockAuthService.createAndSendCookie).toHaveBeenCalledWith(
        {
          username: 'username',
          userId: 'user-1',
          orgId: 'org-1',
          activeWarehouseId: '',
          activeRole: '',
        },
        mockResponse,
      );
    });
    it('should return message', async () => {
      const mockResponse: any = {};
      const response = await organizationController.register(
        'token',
        {
          name: 'organizationName',
          ownerEmail: 'example@example.org',
          ownerUsername: 'username',
          ownerPassword: 'password1',
        },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        mockResponse,
      );
      expect(response).toEqual({
        message: 'Organization created successfully.',
      });
    });
  });
  describe('getUsers', () => {
    it('should call organizationService getUsers with default parameters', async () => {
      await organizationController.getUsers(null, null);
      expect(mockOrganizationService.getUsers).toHaveBeenCalledWith('', 1);
    });
    it('should call organizationService getUsers with specified parameters', async () => {
      await organizationController.getUsers('search', 2);
      expect(mockOrganizationService.getUsers).toHaveBeenCalledWith(
        'search',
        2,
      );
    });
    it('should return organizationService getUsers return value', async () => {
      const response = await organizationController.getUsers('search', 2);
      expect(response).toEqual({
        data: {
          userId: 'user-1',
          username: 'username',
          role: 'staff',
        },
        total: 1,
      });
    });
  });
  describe('updateUserRole', () => {
    it('should call userOrganizationRoleService updateUserRole', async () => {
      await organizationController.updateUserRole({
        username: 'username',
        role: 'admin',
      });
      expect(
        mockUserOrganizationRoleService.updateUserRole,
      ).toHaveBeenCalledWith('username', 'admin');
    });
    it('should return userOrganizationRoleService updateUserRole return value', async () => {
      const response = await organizationController.updateUserRole({
        username: 'username',
        role: 'admin',
      });
      expect(response).toEqual({
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'admin',
      });
    });
  });
});
