import { Test, TestingModule } from '@nestjs/testing';
import { UserWarehouseRoleService } from './userWarehouseRole.service';
import { ClsService } from 'nestjs-cls';
import { UsersService } from '../user/users.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserWarehouseRoleEntity } from './userWarehouseRole.entity';
import { DataSource } from 'typeorm';

describe('UserWarehouseRoleService', () => {
  let service: UserWarehouseRoleService;
  let clsService: jest.Mocked<ClsService>;
  let usersService: jest.Mocked<UsersService>;
  let repository: {
    findOneBy: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserWarehouseRoleService,
        {
          provide: DataSource,
          useValue: {},
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
          useValue: repository,
        },
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
        user_id: 'user-1',
        username: 'jane',
        password: 'hashed',
      });
      repository.findOneBy.mockResolvedValue(null);
      repository.save.mockResolvedValue({
        user_id: 'user-1',
        warehouse_id: 'warehouse-1',
        role: 'staff',
      });

      const result = await service.addUserToWarehouse('jane', 'staff');

      expect(result.role).toBe('staff');
      expect(repository.save).toHaveBeenCalledWith({
        user_id: 'user-1',
        warehouse_id: 'warehouse-1',
        role: 'staff',
      });
    });

    it('should throw when the user already belongs to the warehouse', async () => {
      clsService.get.mockReturnValue('warehouse-1');
      usersService.findByUsername.mockResolvedValue({
        user_id: 'user-1',
        username: 'jane',
        password: 'hashed',
      });
      repository.findOneBy.mockResolvedValue({
        user_id: 'user-1',
        warehouse_id: 'warehouse-1',
        role: 'staff',
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
        user_id: 'user-1',
        username: 'jane',
        password: 'hashed',
      });
      repository.findOneBy.mockResolvedValue({
        user_id: 'user-1',
        warehouse_id: 'warehouse-1',
        role: 'staff',
      });
      repository.save.mockResolvedValue({
        user_id: 'user-1',
        warehouse_id: 'warehouse-1',
        role: 'manager',
      });

      const result = await service.updateUserRole('jane', 'manager');

      expect(result.role).toBe('manager');
      expect(repository.save).toHaveBeenCalledWith({
        user_id: 'user-1',
        warehouse_id: 'warehouse-1',
        role: 'manager',
      });
    });

    it('should throw when the user is not assigned to the warehouse', async () => {
      clsService.get.mockReturnValue('warehouse-1');
      repository.findOneBy.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue({
        user_id: 'user-1',
        username: 'jane',
        password: 'hashed',
      });

      await expect(service.updateUserRole('jane', 'manager')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
