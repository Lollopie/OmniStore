import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseRolesGuard } from '../../src/roles/warehouseRoles/warehouseRoles.guard';
import { AuthenticatedRequest } from '../../src/user/user.decorator';
import { GuardDBService } from '../../src/utils/guardDB.service';
import { ClsService } from 'nestjs-cls';
import { WarehouseRole } from '@shared/enum/warehouseRoles.enum';
describe('WarehouseRolesGuard', () => {
  let warehouseRolesGuard: WarehouseRolesGuard;
  const mockGuardDB = {
    findWarehouse: jest.fn().mockResolvedValue('warehouse-1'),
    getUserWarehouseRole: jest.fn().mockResolvedValue('staff' as WarehouseRole),
  };
  const mockClsService = {
    set: jest.fn(),
  };
  const mockRequest = {
    user: {
      username: 'username',
      userId: 'user-1',
      orgId: 'org-1',
      activeWarehouseId: 'warehouse-1',
      activeRole: 'staff',
    },
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehouseRolesGuard,
        { provide: GuardDBService, useValue: mockGuardDB },
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();

    warehouseRolesGuard = module.get<WarehouseRolesGuard>(WarehouseRolesGuard);
  });
  it('should be defined', () => {
    expect(warehouseRolesGuard).toBeDefined();
  });
  describe('validateToken', () => {
    it('should reject if no user in request', async () => {
      const result: boolean = await warehouseRolesGuard.validateToken(
        {} as AuthenticatedRequest,
        [],
      );
      expect(result).toEqual(false);
    });
    it('should throw if no activeWarehouseId is set', async () => {
      await expect(
        warehouseRolesGuard.validateToken(
          {
            user: {},
          } as AuthenticatedRequest,
          [],
        ),
      ).rejects.toThrow('No active Warehouse found');
    });
    it('should throw if no warehouse is found', async () => {
      mockGuardDB.findWarehouse.mockResolvedValueOnce(null);
      await expect(
        warehouseRolesGuard.validateToken(
          mockRequest as AuthenticatedRequest,
          [],
        ),
      ).rejects.toThrow('Active Warehouse not found');
    });
    it("should throw if user doesn't belong to warehouse", async () => {
      mockGuardDB.getUserWarehouseRole.mockResolvedValueOnce(null);
      await expect(
        warehouseRolesGuard.validateToken(
          mockRequest as AuthenticatedRequest,
          [],
        ),
      ).rejects.toThrow('You do not have access to the active warehouse');
    });
    it('should throw if role not in requiredRoles', async () => {
      await expect(
        warehouseRolesGuard.validateToken(mockRequest as AuthenticatedRequest, [
          WarehouseRole.ADMIN,
          WarehouseRole.MANAGER,
        ]),
      ).rejects.toThrow(
        'You do not have the required role to access this resource',
      );
    });
    it('should set clsService warehouseRole', async () => {
      await warehouseRolesGuard.validateToken(
        mockRequest as AuthenticatedRequest,
        [WarehouseRole.ADMIN, WarehouseRole.MANAGER, WarehouseRole.STAFF],
      );
      expect(mockClsService.set).toHaveBeenCalledWith(
        'warehouseRole',
        WarehouseRole.STAFF,
      );
    });
  });
});
