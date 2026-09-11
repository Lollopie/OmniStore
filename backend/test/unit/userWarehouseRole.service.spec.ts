import { Test, TestingModule } from '@nestjs/testing';
import { UserWarehouseRoleService } from '../../src/userWarehouseRole/userWarehouseRole.service';
import { ClsService } from 'nestjs-cls';
import { UsersService } from '../../src/user/users.service';
import { UserWarehouseRoleEntity } from '../../src/userWarehouseRole/userWarehouseRole.entity';
import { TxRepoProvider } from '../../src/rls/txrepo.service';
import { UserOrganizationRoleEntity } from '../../src/userOrganizationRole/userOrganizationRole.entity';

describe('UserWarehouseRoleService', () => {
  let userWarehouseRoleService: UserWarehouseRoleService;
  const mockClsService = {
    get: jest.fn().mockImplementation((target: string) => {
      if (target === 'orgId') {
        return 'org-1';
      }
      if (target === 'warehouseId') {
        return 'warehouse-1';
      }
      throw new Error(`Unexpected target: ${target}`);
    }),
  };
  const mockUsersService = {
    findByUsername: jest.fn().mockResolvedValue({
      userId: 'user-1',
      email: 'example@example.org',
      username: 'username',
      password: 'password1',
    }),
  };
  const mockUserWarehouseRoleRepository = {
    findOneBy: jest.fn().mockResolvedValue({
      userId: 'user-1',
      warehouseId: 'warehouse-1',
      role: 'manager',
    }),
    save: jest.fn().mockResolvedValue({
      userId: 'user-1',
      warehouseId: 'warehouse-1',
      role: 'admin',
    }),
    createQueryBuilder: jest.fn().mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
      getRawMany: jest.fn().mockResolvedValue([
        {
          userId: 'user-1',
          warehouseId: 'warehouse-1',
          role: 'manager',
        },
      ]),
    }),
  };
  const mockUserOrganizationRoleRepository = {
    findOneBy: jest.fn().mockResolvedValue({
      userId: 'user-1',
      orgId: 'org-1',
      role: 'admin',
    }),
  };
  const mockTxRepoProvider = {
    query: jest.fn().mockResolvedValue([{}]),
    getRepo: jest.fn().mockImplementation((entity) => {
      if (entity === UserWarehouseRoleEntity) {
        return mockUserWarehouseRoleRepository;
      }
      if (entity === UserOrganizationRoleEntity) {
        return mockUserOrganizationRoleRepository;
      }
      throw new Error('Unexpected entity type');
    }),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserWarehouseRoleService,
        {
          provide: TxRepoProvider,
          useValue: mockTxRepoProvider,
        },
        {
          provide: ClsService,
          useValue: mockClsService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    userWarehouseRoleService = module.get(UserWarehouseRoleService);
  });

  it('should be defined', () => {
    expect(userWarehouseRoleService).toBeDefined();
  });
  describe('findRole', () => {
    it('should call findOneBy with correct parameters', async () => {
      await userWarehouseRoleService.findRole('user-1', 'warehouse-1');
      expect(mockUserWarehouseRoleRepository.findOneBy).toHaveBeenCalledWith({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
      });
    });
    it('should return the result from findOneBy', async () => {
      const result = await userWarehouseRoleService.findRole(
        'user-1',
        'warehouse-1',
      );
      expect(result).toEqual({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
        role: 'manager',
      });
    });
  });
  describe('addUserToWarehouse', () => {
    it('should check if user exists', async () => {
      mockUserWarehouseRoleRepository.findOneBy.mockResolvedValueOnce(null);
      await userWarehouseRoleService.addUserToWarehouse('testuser', 'admin');
      expect(mockUsersService.findByUsername).toHaveBeenCalledWith('testuser');
    });
    it("should throw if user doesn't exist", async () => {
      mockUsersService.findByUsername.mockResolvedValueOnce(null);
      await expect(
        userWarehouseRoleService.addUserToWarehouse('testuser', 'admin'),
      ).rejects.toThrow('User not found');
    });
    it('should check that user belongs to org', async () => {
      mockUserWarehouseRoleRepository.findOneBy.mockResolvedValueOnce(null);
      await userWarehouseRoleService.addUserToWarehouse('testuser', 'admin');
      expect(mockUserOrganizationRoleRepository.findOneBy).toHaveBeenCalledWith(
        {
          userId: 'user-1',
          orgId: 'org-1',
        },
      );
    });
    it("should throw if user doesn't belong to org", async () => {
      mockUserOrganizationRoleRepository.findOneBy.mockResolvedValueOnce(null);
      await expect(
        userWarehouseRoleService.addUserToWarehouse('testuser', 'admin'),
      ).rejects.toThrow();
    });
    it('should check if the user already belongs to warehouse', async () => {
      mockUserWarehouseRoleRepository.findOneBy.mockResolvedValueOnce(null);
      await userWarehouseRoleService.addUserToWarehouse('testuser', 'admin');
      expect(mockUserWarehouseRoleRepository.findOneBy).toHaveBeenCalledWith({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
      });
    });
    it('should throw if user already belongs to warehouse', async () => {
      await expect(
        userWarehouseRoleService.addUserToWarehouse('testuser', 'admin'),
      ).rejects.toThrow('User already belongs to this warehouse');
    });
    it('should save new userWarehouseRole', async () => {
      mockUserWarehouseRoleRepository.findOneBy.mockResolvedValueOnce(null);
      await userWarehouseRoleService.addUserToWarehouse('testuser', 'admin');
      expect(mockUserWarehouseRoleRepository.save).toHaveBeenCalledWith({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
        role: 'admin',
      });
    });
    it('should return new userWarehouseRole', async () => {
      mockUserWarehouseRoleRepository.findOneBy.mockResolvedValueOnce(null);
      const result = await userWarehouseRoleService.addUserToWarehouse(
        'testuser',
        'admin',
      );
      expect(result).toEqual({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
        role: 'admin',
      });
    });
  });
  describe('updateUserRole', () => {
    it('should check if user exists', async () => {
      await userWarehouseRoleService.updateUserRole('username', 'admin');
      expect(mockUsersService.findByUsername).toHaveBeenCalledWith('username');
    });
    it("should throw if user doesn't exist", async () => {
      mockUsersService.findByUsername.mockResolvedValueOnce(null);
      await expect(
        userWarehouseRoleService.updateUserRole('username', 'admin'),
      ).rejects.toThrow('User not found');
    });
    it('should check that user is in warehouse', async () => {
      await userWarehouseRoleService.updateUserRole('username', 'admin');
      expect(mockUserWarehouseRoleRepository.findOneBy).toHaveBeenCalledWith({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
      });
    });
    it("should throw if user isn't in warehouse", async () => {
      mockUserWarehouseRoleRepository.findOneBy.mockResolvedValueOnce(null);
      await expect(
        userWarehouseRoleService.updateUserRole('username', 'admin'),
      ).rejects.toThrow('User is not assigned to this warehouse');
    });
    it('should save updated userWarehouseRole', async () => {
      await userWarehouseRoleService.updateUserRole('username', 'admin');
      expect(mockUserWarehouseRoleRepository.save).toHaveBeenCalledWith({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
        role: 'admin',
      });
    });
    it('should return updated userWarehouseRole', async () => {
      const result = await userWarehouseRoleService.updateUserRole(
        'username',
        'admin',
      );
      expect(result).toEqual({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
        role: 'admin',
      });
    });
  });
  describe('getUsers', () => {
    it('should execute correct query', async () => {
      await userWarehouseRoleService.getUsers(1, 10, '');
      expect(
        mockUserWarehouseRoleRepository.createQueryBuilder,
      ).toHaveBeenCalledWith('user_warehouse_role');
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserWarehouseRoleRepository.createQueryBuilder().innerJoin,
      ).toHaveBeenCalledWith(
        'UserEntity',
        'user',
        'user.userId = user_warehouse_role.userId',
      );
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserWarehouseRoleRepository.createQueryBuilder().where,
      ).toHaveBeenCalledWith('user_warehouse_role.warehouseId = :warehouseId', {
        warehouseId: 'warehouse-1',
      });
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserWarehouseRoleRepository.createQueryBuilder().getCount,
      ).toHaveBeenCalled();
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserWarehouseRoleRepository.createQueryBuilder().select,
      ).toHaveBeenCalledWith([
        'user.userId AS "userId"',
        'user.username AS username',
        'user_warehouse_role.role AS role',
      ]);
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserWarehouseRoleRepository.createQueryBuilder().offset,
      ).toHaveBeenCalledWith(0);
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserWarehouseRoleRepository.createQueryBuilder().limit,
      ).toHaveBeenCalledWith(10);
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserWarehouseRoleRepository.createQueryBuilder().getRawMany,
      ).toHaveBeenCalled();
    });
    it('should calculate paging correctly', async () => {
      await userWarehouseRoleService.getUsers(2, 10, '');
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserWarehouseRoleRepository.createQueryBuilder().offset,
      ).toHaveBeenCalledWith(10);
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserWarehouseRoleRepository.createQueryBuilder().limit,
      ).toHaveBeenCalledWith(10);
    });
    it('should trim search term', async () => {
      await userWarehouseRoleService.getUsers(1, 10, '  search  ');
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserWarehouseRoleRepository.createQueryBuilder().andWhere,
      ).toHaveBeenCalledWith('user.username ILIKE :search', {
        search: `%search%`,
      });
    });
    it('should return result correctly', async () => {
      const result = await userWarehouseRoleService.getUsers(1, 10, '');
      expect(result).toEqual({
        data: [
          {
            userId: 'user-1',
            warehouseId: 'warehouse-1',
            role: 'manager',
          },
        ],
        total: 1,
      });
    });
  });
});
