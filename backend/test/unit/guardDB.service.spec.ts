import { GuardDBService } from '../../src/utils/guardDB.service';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
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
  describe('getOrgSubscription', () => {
    it('should call get_org_subscription with correct parameters', async () => {
      mockDataSource.query.mockReturnValueOnce([
        {
          subscription: 'starter',
        },
      ]);
      await guardDBService.getOrgSubscription('org-1');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        `SELECT get_org_subscription($1) AS subscription`,
        ['org-1'],
      );
    });
    it('should return found subscription', async () => {
      mockDataSource.query.mockReturnValueOnce([
        {
          subscription: 'starter',
        },
      ]);
      const result = await guardDBService.getOrgSubscription('org-1');
      expect(result).toEqual('starter');
    });
    it('should return null if organization has no subscription', async () => {
      mockDataSource.query.mockReturnValueOnce([
        {
          subscription: null,
        },
      ]);
      const result = await guardDBService.getOrgSubscription('org-1');
      expect(result).toBeNull();
    });
  });
  describe('setOrgSubscription', () => {
    it('should call set_org_subscription with correct parameters', async () => {
      mockDataSource.query.mockReturnValueOnce([]);
      await guardDBService.setOrgSubscription('org-1', 'growth', 'sub_1');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        `SELECT set_org_subscription($1, $2, $3)`,
        ['org-1', 'growth', 'sub_1'],
      );
    });
  });
  describe('updateOrgSubscriptionPlan', () => {
    it('should call update_org_subscription_plan with correct parameters', async () => {
      mockDataSource.query.mockReturnValueOnce([]);
      await guardDBService.updateOrgSubscriptionPlan('sub_1', 'enterprise');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        `SELECT update_org_subscription_plan($1, $2)`,
        ['sub_1', 'enterprise'],
      );
    });
  });
  describe('clearOrgSubscription', () => {
    it('should call clear_org_subscription with correct parameters', async () => {
      mockDataSource.query.mockReturnValueOnce([]);
      await guardDBService.clearOrgSubscription('sub_1');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        `SELECT clear_org_subscription($1)`,
        ['sub_1'],
      );
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
      const result = await guardDBService.getUserWarehouseRole(
        'user-1',
        'warehouse-1',
      );
      expect(result).toEqual('admin');
    });
  });
  describe('refresh tokens', () => {
    const expiresAt = new Date('2026-10-12T00:00:00Z');
    it('should create a refresh token', async () => {
      await guardDBService.createRefreshToken('user-1', 'hash', expiresAt);
      expect(mockDataSource.query).toHaveBeenCalledWith(
        `SELECT create_refresh_token($1, $2, $3)`,
        ['user-1', 'hash', expiresAt],
      );
    });
    it('should create the refresh token in the given transaction', async () => {
      const manager = { query: jest.fn() };
      await guardDBService.createRefreshToken(
        'user-1',
        'hash',
        expiresAt,
        manager as unknown as EntityManager,
      );
      expect(manager.query).toHaveBeenCalledWith(
        `SELECT create_refresh_token($1, $2, $3)`,
        ['user-1', 'hash', expiresAt],
      );
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });
    it('should rotate a refresh token', async () => {
      mockDataSource.query.mockReturnValueOnce([
        { token_user_id: 'user-1', reused: false },
      ]);
      const result = await guardDBService.rotateRefreshToken(
        'old',
        'new',
        expiresAt,
      );
      expect(mockDataSource.query).toHaveBeenCalledWith(
        `SELECT * FROM rotate_refresh_token($1, $2, $3)`,
        ['old', 'new', expiresAt],
      );
      expect(result).toEqual({ userId: 'user-1', reused: false });
    });
    it('should return null for unknown refresh tokens', async () => {
      mockDataSource.query.mockReturnValueOnce([]);
      await expect(
        guardDBService.rotateRefreshToken('old', 'new', expiresAt),
      ).resolves.toBeNull();
    });
    it('should delete a refresh token', async () => {
      await guardDBService.deleteRefreshToken('hash');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        `SELECT delete_refresh_token($1)`,
        ['hash'],
      );
    });
    it('should revoke all refresh tokens of a user', async () => {
      await guardDBService.revokeUserRefreshTokens('user-1');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        `SELECT revoke_user_refresh_tokens($1)`,
        ['user-1'],
      );
    });
  });
  describe('getUserSession', () => {
    it('should map the session of a member', async () => {
      mockDataSource.query.mockReturnValueOnce([
        { username: 'username', org_id: 'org-1', org_role: 'member' },
      ]);
      await expect(guardDBService.getUserSession('user-1')).resolves.toEqual({
        username: 'username',
        orgId: 'org-1',
        orgRole: 'member',
      });
      expect(mockDataSource.query).toHaveBeenCalledWith(
        `SELECT * FROM get_user_session($1)`,
        ['user-1'],
      );
    });
    it('should return null for deleted users', async () => {
      mockDataSource.query.mockReturnValueOnce([]);
      await expect(guardDBService.getUserSession('user-1')).resolves.toBeNull();
    });
  });
});
