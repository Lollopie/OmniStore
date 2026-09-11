import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseService } from '../../src/warehouse/warehouse.service';
import { WarehouseEntity } from '../../src/warehouse/warehouse.entity';
import { TxRepoProvider } from '../../src/rls/txrepo.service';
import { ClsService } from 'nestjs-cls';
import { UserWarehouseRoleEntity } from '../../src/userWarehouseRole/userWarehouseRole.entity';
describe('WarehouseService', () => {
  let warehouseService: WarehouseService;
  const mockTxRepoProvider = {
    getRepo: jest.fn().mockImplementation((entity) => {
      if (entity === WarehouseEntity) {
        return mockWarehouseRepository;
      }
      if (entity === UserWarehouseRoleEntity) {
        return mockUserWarehouseRoleRepository;
      }
      throw new Error(`Unexpected Entity ${entity}`);
    }),
  };
  const mockClsService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'orgId') {
        return 'org-1';
      }
      throw new Error(`Unexpected key ${key}`);
    }),
  };
  const mockWarehouseRepository = {
    create: jest.fn().mockReturnValue({
      warehouseId: 'warehouse-1',
      name: 'warehouse',
      orgId: 'org-1',
    }),
    save: jest.fn().mockResolvedValue({
      warehouseId: 'warehouse-1',
      name: 'warehouse',
      orgId: 'org-1',
    }),
  };
  const mockUserWarehouseRoleRepository = {
    create: jest.fn().mockReturnValue({
      userId: 'user-1',
      warehouseId: 'warehouse-1',
      role: 'admin',
    }),
    save: jest.fn().mockResolvedValue({
      userId: 'user-1',
      warehouseId: 'warehouse-1',
      role: 'admin',
    }),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehouseService,
        { provide: TxRepoProvider, useValue: mockTxRepoProvider },
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();

    warehouseService = module.get<WarehouseService>(WarehouseService);
  });
  it('should be defined', () => {
    expect(warehouseService).toBeDefined();
  });
  describe('createWarehouse', () => {
    it('should call warehouseRepository create with expected parameters', async () => {
      await warehouseService.createWarehouse(
        {
          warehouseName: 'warehouse',
        },
        'user-1',
        'admin',
      );
      expect(mockWarehouseRepository.create).toHaveBeenCalledWith({
        name: 'warehouse',
        orgId: 'org-1',
      });
    });
    it('should call warehouseRepository save with expected parameters', async () => {
      await warehouseService.createWarehouse(
        {
          warehouseName: 'warehouse',
        },
        'user-1',
        'admin',
      );
      expect(mockWarehouseRepository.save).toHaveBeenCalledWith({
        warehouseId: 'warehouse-1',
        name: 'warehouse',
        orgId: 'org-1',
      });
    });
    it('should call userWarehouseRoleRepository create with expected parameters', async () => {
      await warehouseService.createWarehouse(
        {
          warehouseName: 'warehouse',
        },
        'user-1',
        'admin',
      );
      expect(mockUserWarehouseRoleRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
        role: 'admin',
      });
    });
    it('should call userWarehouseRoleRepository save with expected parameters', async () => {
      await warehouseService.createWarehouse(
        {
          warehouseName: 'warehouse',
        },
        'user-1',
        'admin',
      );
      expect(mockUserWarehouseRoleRepository.save).toHaveBeenCalledWith({
        userId: 'user-1',
        warehouseId: 'warehouse-1',
        role: 'admin',
      });
    });
    it('should return new warehouse', async () => {
      const result = await warehouseService.createWarehouse(
        {
          warehouseName: 'warehouse',
        },
        'user-1',
        'admin',
      );
      expect(result).toEqual({
        warehouseId: 'warehouse-1',
        orgId: 'org-1',
        name: 'warehouse',
      });
    });
  });
});
