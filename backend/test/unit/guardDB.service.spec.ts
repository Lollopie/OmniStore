import { GuardDBService } from '../../src/utils/guardDB.service';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
describe('GuardDBService', () => {
  let guardDBService: GuardDBService;
  const mockDataSource = {
    query: jest.fn(),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuardDBService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    guardDBService = module.get<GuardDBService>(GuardDBService);
  });
  it('should be defined', () => {
    expect(guardDBService).toBeDefined();
  });
  describe('getUserOrgRole', () => {
    it('should call get_user_org_role with correct parameters', async () => {
      mockDataSource.query.mockReturnValueOnce([
        {
          role: 'owner',
        },
      ]);
      await guardDBService.getUserOrgRole('user-1', 'org-1');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        `SELECT get_user_org_role($1, $2) AS role`,
        ['user-1', 'org-1'],
      );
    });
    it('should return found role', async () => {
      mockDataSource.query.mockReturnValueOnce([
        {
          role: 'owner',
        },
      ]);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await guardDBService.getUserOrgRole('user-1', 'org-1');
      expect(result).toEqual('owner');
    });
  });
  describe('getOrg', () => {
    it('should call get_org with correct parameters', async () => {
      mockDataSource.query.mockReturnValueOnce([
        {
          name: 'organization',
        },
      ]);
      await guardDBService.getOrg('org-1');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        `SELECT get_org($1) AS name`,
        ['org-1'],
      );
    });
    it('should return found organization name', async () => {
      mockDataSource.query.mockReturnValueOnce([
        {
          name: 'organization',
        },
      ]);
      const result = await guardDBService.getOrg('org-1');
      expect(result).toEqual('organization');
    });
  });
  describe('findWarehouse', () => {
    it('should call get_warehouse with correct parameters', async () => {
      mockDataSource.query.mockReturnValueOnce([
        {
          name: 'warehouse',
        },
      ]);
      await guardDBService.findWarehouse('warehouse-1');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        `SELECT get_warehouse($1) AS name`,
        ['warehouse-1'],
      );
    });
    it('should return found warehouse name', async () => {
      mockDataSource.query.mockReturnValueOnce([
        {
          name: 'warehouse',
        },
      ]);
      const result = await guardDBService.findWarehouse('warehouse-1');
      expect(result).toEqual('warehouse');
    });
  });
  describe('getUserWarehouseRole', () => {
    it('should call get_user_warehouse_role with correct parameters', async () => {
      mockDataSource.query.mockReturnValueOnce([
        {
          role: 'admin',
        },
      ]);
      await guardDBService.getUserWarehouseRole('user-1', 'warehouse-1');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        `SELECT get_user_warehouse_role($1, $2) AS role`,
        ['user-1', 'warehouse-1'],
      );
    });
    it('should return found role', async () => {
      mockDataSource.query.mockReturnValueOnce([
        {
          role: 'admin',
        },
      ]);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await guardDBService.getUserWarehouseRole(
        'user-1',
        'warehouse-1',
      );
      expect(result).toEqual('admin');
    });
  });
});
