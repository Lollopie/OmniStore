import { Test, TestingModule } from '@nestjs/testing';
import { UserWarehouseRoleService } from './userWarehouseRole.service';
import { ClsService } from 'nestjs-cls';
import { UsersService } from '../user/users.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserWarehouseRoleEntity } from './userWarehouseRole.entity';
import { DataSource } from 'typeorm';
import { TxRepoProvider } from '../rls/db.helper';
import { UserOrganizationRoleEntity } from '../userOrganizationRole/userOrganizationRole.entity';

describe('UserWarehouseRoleService', () => {
  let service: UserWarehouseRoleService;
  let clsService: jest.Mocked<ClsService>;
  let usersService: jest.Mocked<UsersService>;
  let userWarehouseRoleRepository: {
    findOneBy: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let userOrganizationRoleRepository: {
    findOneBy: jest.Mock;
  };

  beforeEach(async () => {
    userWarehouseRoleRepository = {
      findOneBy: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getRawMany: jest.fn().mockResolvedValue([]),
      }),
    };
    userOrganizationRoleRepository = {
      findOneBy: jest.fn(),
    };
    const mockEntityManager = {
      query: jest.fn().mockResolvedValue([{}]),
      getRepo: jest.fn().mockImplementation((entity) => {
        if (entity === UserWarehouseRoleEntity) {
          return userWarehouseRoleRepository;
        }
        if (entity === UserOrganizationRoleEntity) {
          return userOrganizationRoleRepository;
        }
        throw new Error('Unexpected entity type');
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserWarehouseRoleService,
        {
          provide: TxRepoProvider,
          useValue: mockEntityManager,
        },
        {
          provide: ClsService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByUsername: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserWarehouseRoleEntity),
          useValue: userWarehouseRoleRepository,
        },
        {
          provide: getRepositoryToken(UserOrganizationRoleEntity),
          useValue: userOrganizationRoleRepository,
        }
      ],
    }).compile();

    service = module.get(UserWarehouseRoleService);
    clsService = module.get(ClsService);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addUserToWarehouse', () => {
    it('should create a user role assignment for the active warehouse', async () => {
      clsService.get.mockReturnValue('warehouse-1');
      usersService.findByUsername.mockResolvedValue({
        userId: 'user-1',
        email: 'test@example.org',
        username: 'jane',
        password: 'hashed',
      });
      userWarehouseRoleRepository.findOneBy.mockResolvedValue(null);
      userWarehouseRoleRepository.save.mockResolvedValue({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
        role: 'staff',
      });
      userOrganizationRoleRepository.findOneBy.mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
        role: 'member',
      });

      const result = await service.addUserToWarehouse('jane', 'staff');

      expect(result.role).toBe('staff');
      expect(userWarehouseRoleRepository.save).toHaveBeenCalledWith({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
        role: 'staff',
      });
    });

    it('should throw when the user already belongs to the warehouse', async () => {
      clsService.get.mockReturnValue('warehouse-1');
      usersService.findByUsername.mockResolvedValue({
        userId: 'user-1',
        email: 'test@example.org',
        username: 'jane',
        password: 'hashed',
      });
      userWarehouseRoleRepository.findOneBy.mockResolvedValue({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
        role: 'staff',
      });
      userOrganizationRoleRepository.findOneBy.mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
        role: 'member',
      });
      await expect(
        service.addUserToWarehouse('jane', 'manager'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateUserRole', () => {
    it('should update the existing role assignment', async () => {
      clsService.get.mockReturnValue('warehouse-1');
      usersService.findByUsername.mockResolvedValue({
        userId: 'user-1',
        email: 'test@example.org',
        username: 'jane',
        password: 'hashed',
      });
      userWarehouseRoleRepository.findOneBy.mockResolvedValue({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
        role: 'staff',
      });
      userWarehouseRoleRepository.save.mockResolvedValue({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
        role: 'manager',
      });

      const result = await service.updateUserRole('jane', 'manager');

      expect(result.role).toBe('manager');
      expect(userWarehouseRoleRepository.save).toHaveBeenCalledWith({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
        role: 'manager',
      });
    });

    it('should throw when the user is not assigned to the warehouse', async () => {
      clsService.get.mockReturnValue('warehouse-1');
      userWarehouseRoleRepository.findOneBy.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue({
        userId: 'user-1',
        email: 'test@example.org',
        username: 'jane',
        password: 'hashed',
      });

      await expect(service.updateUserRole('jane', 'manager')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
