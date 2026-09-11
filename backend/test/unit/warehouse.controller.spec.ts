import { WarehouseController } from '../../src/warehouse/warehouse.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseService } from '../../src/warehouse/warehouse.service';
import { MailService } from '../../src/mail/mail.service';
import { UserWarehouseRoleService } from '../../src/userWarehouseRole/userWarehouseRole.service';
import { InviteService } from '../../src/invite/invite.service';
import { ClsService } from 'nestjs-cls';
import { AuthService } from '../../src/auth/auth.service';
import { OrganizationService } from '../../src/organization/organization.service';
import { Response } from 'express';
import { CanActivate } from '@nestjs/common';
import { AuthGuard } from '../../src/auth/auth.guard';
import { WarehouseRolesGuard } from '../../src/roles/warehouseRoles/warehouseRoles.guard';
import { OrganizationRolesGuard } from '../../src/roles/organizationRoles/organizationRoles.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from '../../src/config/app.config';
describe('WarehouseController', () => {
  let warehouseController: WarehouseController;
  let configService: ConfigService;
  const mockWarehouseService = {
    createWarehouse: jest.fn().mockResolvedValue({
      warehouseId: 'warehouse-1',
      orgId: 'org-1',
      name: 'Warehouse',
    }),
  };
  const mockMailService = {
    sendInviteEmail: jest.fn(),
  };
  const mockUserWarehouseRoleService = {
    findRole: jest.fn().mockResolvedValue({
      userId: 'user-1',
      warehouseId: 'warehouse-1',
      role: 'admin',
    }),
    getUsers: jest.fn().mockResolvedValue({
      data: [
        {
          userId: 'user-1',
          username: 'username',
          role: 'admin',
        },
      ],
      total: 1,
    }),
    updateUserRole: jest.fn().mockResolvedValue({
      userId: 'user-1',
      warehouseId: 'warehouse-1',
      role: 'manager',
    }),
    addUserToWarehouse: jest.fn().mockResolvedValue({
      userId: 'user-1',
      warehouseId: 'warehouse-1',
      role: 'manager',
    }),
  };
  const mockInviteService = {
    inviteWarehouseUser: jest.fn().mockResolvedValue({
      invite: {
        inviteId: 'invite-1',
        email: 'example@example.org',
        orgId: 'org-1',
        role: 'owner',
        tokenHash: 'mocked-hashed-token',
        expiresAt: new Date(),
        createdAt: new Date(),
      },
      rawToken: 'mocked-raw-token',
    }),
  };
  const mockClsService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'orgId') {
        return 'org-1';
      }
      if (key === 'warehouseRole') {
        return 'admin';
      }
      if (key === 'orgRole') {
        return 'owner';
      }
      throw new Error(`Unexpected key: ${key}`);
    }),
  };
  const mockAuthService = {
    createAndSendCookie: jest.fn(),
  };
  const mockOrgService = {
    findByOrgId: jest.fn().mockResolvedValue({
      orgId: 'org-1',
      name: 'organization',
    }),
  };
  const mockUserToken = {
    username: 'username',
    userId: 'user-1',
    orgId: 'org-1',
    activeWarehouseId: 'warehouse-1',
    activeRole: 'staff',
  };
  class MockGuard implements CanActivate {
    canActivate(): boolean {
      return true;
    }
  }
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarehouseController],
      providers: [
        { provide: WarehouseService, useValue: mockWarehouseService },
        { provide: MailService, useValue: mockMailService },
        {
          provide: UserWarehouseRoleService,
          useValue: mockUserWarehouseRoleService,
        },
        { provide: InviteService, useValue: mockInviteService },
        { provide: ClsService, useValue: mockClsService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: OrganizationService, useValue: mockOrgService },
      ],
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env`, `.env.${process.env.NODE_ENV || 'test'}`],
          load: [appConfig],
        }),
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(MockGuard)
      .overrideGuard(OrganizationRolesGuard)
      .useValue(MockGuard)
      .overrideGuard(WarehouseRolesGuard)
      .useValue(MockGuard)
      .compile();

    warehouseController = module.get<WarehouseController>(WarehouseController);
    configService = module.get<ConfigService>(ConfigService);
  });
  it('should be defined', () => {
    expect(warehouseController).toBeDefined();
  });
  describe('create', () => {
    it('should call warehouseService createWarehouse with expected parameters', async () => {
      const mockResponse = {} as Response;
      await warehouseController.create(
        {
          warehouseName: 'Warehouse',
        },
        mockUserToken,
        mockResponse,
      );
      expect(mockWarehouseService.createWarehouse).toHaveBeenCalledWith(
        { warehouseName: 'Warehouse' },
        'user-1',
        'admin',
      );
    });
    it("should return error if warehouse couldn't be created", async () => {
      const mockResponse = {} as Response;
      mockWarehouseService.createWarehouse.mockResolvedValueOnce(null);
      const result = await warehouseController.create(
        {
          warehouseName: 'Warehouse',
        },
        mockUserToken,
        mockResponse,
      );
      expect(result).toEqual({ error: 'Creation failed' });
    });
    it('should call createAndSendCookie with expected parameters', async () => {
      const mockResponse = {} as Response;
      await warehouseController.create(
        {
          warehouseName: 'Warehouse',
        },
        mockUserToken,
        mockResponse,
      );
      expect(mockAuthService.createAndSendCookie).toHaveBeenCalledWith(
        {
          userId: 'user-1',
          username: 'username',
          orgId: 'org-1',
          activeWarehouseId: 'warehouse-1',
          activeRole: 'admin',
        },
        mockResponse,
      );
    });
    it('should return new warehouse details', async () => {
      const mockResponse = {} as Response;
      const result = await warehouseController.create(
        {
          warehouseName: 'Warehouse',
        },
        mockUserToken,
        mockResponse,
      );
      expect(result).toEqual({
        name: 'Warehouse',
        warehouseId: 'warehouse-1',
        role: 'admin',
      });
    });
  });
  describe('select', () => {
    it('should check that the user is a member of the warehouse', async () => {
      await warehouseController.select(
        {
          warehouseId: 'warehouse-1',
        },
        mockUserToken,
        {} as Response,
      );
      expect(mockUserWarehouseRoleService.findRole).toHaveBeenCalledWith(
        'user-1',
        'warehouse-1',
      );
    });
    it("should return an error if the user isn't a member of the warehouse", async () => {
      mockUserWarehouseRoleService.findRole.mockResolvedValueOnce(null);
      const result = await warehouseController.select(
        {
          warehouseId: 'warehouse-1',
        },
        mockUserToken,
        {} as Response,
      );
      expect(result).toEqual({ error: 'Selection failed' });
    });
    it('should call createAndSendCookie with expected parameters', async () => {
      const mockResponse = {} as Response;
      await warehouseController.select(
        {
          warehouseId: 'warehouse-1',
        },
        mockUserToken,
        mockResponse,
      );
      expect(mockAuthService.createAndSendCookie).toHaveBeenCalledWith(
        {
          userId: 'user-1',
          username: 'username',
          orgId: 'org-1',
          activeWarehouseId: 'warehouse-1',
          activeRole: 'admin',
        },
        mockResponse,
      );
    });
    it('should return the active role of the user in the selected warehouse', async () => {
      const result = await warehouseController.select(
        {
          warehouseId: 'warehouse-1',
        },
        mockUserToken,
        {} as Response,
      );
      expect(result).toEqual({ activeRole: 'admin' });
    });
  });
  describe('getUsers', () => {
    it('should call getUsers with default parameters', async () => {
      await warehouseController.get(null, null);
      expect(mockUserWarehouseRoleService.getUsers).toHaveBeenCalledWith(
        1,
        10,
        '',
      );
    });
    it('should call getUsers with explicit parameters', async () => {
      await warehouseController.get(2, 'search');
      expect(mockUserWarehouseRoleService.getUsers).toHaveBeenCalledWith(
        2,
        10,
        'search',
      );
    });
    it('should return getUsers return value', async () => {
      const result = await warehouseController.get(1, '');
      expect(result).toEqual({
        data: [
          {
            userId: 'user-1',
            username: 'username',
            role: 'admin',
          },
        ],
        total: 1,
      });
    });
  });
  describe('inviteUser', () => {
    it('should get roles from clsService', async () => {
      await warehouseController.inviteUser({
        email: 'example@example.org',
        role: 'admin',
      });
      expect(mockClsService.get).toHaveBeenCalledWith('orgRole');
      expect(mockClsService.get).toHaveBeenCalledWith('warehouseRole');
    });
    it("should throw if user isn't allowed to invite users at that role", async () => {
      const mockFunction = (key: string) => {
        if (key === 'orgRole') {
          return 'member';
        }
        if (key === 'warehouseRole') {
          return 'staff';
        }
        throw new Error(`Unexpected key: ${key}`);
      };
      mockClsService.get.mockImplementationOnce(mockFunction);
      mockClsService.get.mockImplementationOnce(mockFunction);
      await expect(
        warehouseController.inviteUser({
          email: 'example@example.org',
          role: 'admin',
        }),
      ).rejects.toThrow(
        'You do not have permission to invite users with this role',
      );
    });
    it('should call inviteService inviteWarehouseUser with expected parameters', async () => {
      await warehouseController.inviteUser({
        email: 'example@example.org',
        role: 'admin',
      });
      expect(mockInviteService.inviteWarehouseUser).toHaveBeenCalledWith(
        'example@example.org',
        'admin',
      );
    });
    it("should throw if invite couldn't be created", async () => {
      mockInviteService.inviteWarehouseUser.mockResolvedValueOnce(null);
      await expect(
        warehouseController.inviteUser({
          email: 'example@example.org',
          role: 'admin',
        }),
      ).rejects.toThrow('Invite creation failed');
    });
    it('should call sendInviteEmail with correct parameters', async () => {
      await warehouseController.inviteUser({
        email: 'example@example.org',
        role: 'admin',
      });
      expect(mockMailService.sendInviteEmail).toHaveBeenCalledWith(
        'example@example.org',
        {
          organizationName: 'organization',
          verificationUrl: `${configService.get('app.frontendUrl')}/invites/accept?token=mocked-raw-token`,
          expiresInHours: 24,
        },
      );
    });
    it("should throw if organization can't be found", async () => {
      mockOrgService.findByOrgId.mockResolvedValueOnce(null);
      await expect(
        warehouseController.inviteUser({
          email: 'example@example.org',
          role: 'admin',
        }),
      ).rejects.toThrow('Organization not found');
    });
    it('should return success message', async () => {
      const result = await warehouseController.inviteUser({
        email: 'example@example.org',
        role: 'admin',
      });
      expect(result).toEqual({ message: 'Invite sent successfully.' });
    });
  });
  describe('updateUserRole', () => {
    it('should call updateUserRole with expected parameters', async () => {
      await warehouseController.updateUserRole({
        username: 'username',
        role: 'manager',
      });
      expect(mockUserWarehouseRoleService.updateUserRole).toHaveBeenCalledWith(
        'username',
        'manager',
      );
    });
    it('should return updateUserRole return value', async () => {
      const result = await warehouseController.updateUserRole({
        username: 'username',
        role: 'manager',
      });
      expect(result).toEqual({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
        role: 'manager',
      });
    });
  });
  describe('addUserToWarehouse', () => {
    it('should get warehouseRole from clsService', async () => {
      await warehouseController.addUserToWarehouse({
        username: 'username',
        role: 'manager',
      });
      expect(mockClsService.get).toHaveBeenCalledWith('warehouseRole');
    });
    it("should throw if user can't invite users of role to warehouse", async () => {
      mockClsService.get.mockImplementationOnce((key: string) => {
        if (key === 'warehouseRole') {
          return 'staff';
        }
        throw new Error(`Unexpected key: ${key}`);
      });
      await expect(
        warehouseController.addUserToWarehouse({
          username: 'username',
          role: 'manager',
        }),
      ).rejects.toThrow(
        'You do not have permission to add users with this role',
      );
    });
    it('should call userWarehouseRoleService addUserToWarehouse with expected parameters', async () => {
      await warehouseController.addUserToWarehouse({
        username: 'username',
        role: 'manager',
      });
      expect(
        mockUserWarehouseRoleService.addUserToWarehouse,
      ).toHaveBeenCalledWith('username', 'manager');
    });
    it('should return userWarehouseRoleService addUserToWarehouse return value', async () => {
      const result = await warehouseController.addUserToWarehouse({
        username: 'username',
        role: 'manager',
      });
      expect(result).toEqual({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
        role: 'manager',
      });
    });
  });
});
