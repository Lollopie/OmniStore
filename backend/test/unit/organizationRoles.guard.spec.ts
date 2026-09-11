import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationRolesGuard } from '../../src/roles/organizationRoles/organizationRoles.guard';
import { AuthenticatedRequest } from '../../src/user/user.decorator';
import { GuardDBService } from '../../src/utils/guardDB.service';
import { ClsService } from 'nestjs-cls';
import { OrganizationRole } from '@shared/enum/organizationRoles.enum';
describe('OrganizationRolesGuard', () => {
  let organizationRolesGuard: OrganizationRolesGuard;
  const mockGuardDB = {
    getOrg: jest.fn().mockResolvedValue('org-1'),
    getUserOrgRole: jest.fn().mockResolvedValue('member' as OrganizationRole),
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
        OrganizationRolesGuard,
        { provide: GuardDBService, useValue: mockGuardDB },
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();

    organizationRolesGuard = module.get<OrganizationRolesGuard>(
      OrganizationRolesGuard,
    );
  });
  it('should be defined', () => {
    expect(organizationRolesGuard).toBeDefined();
  });
  describe('validateToken', () => {
    it('should reject if no user in request', async () => {
      const result: boolean = await organizationRolesGuard.validateToken(
        {} as AuthenticatedRequest,
        [],
      );
      expect(result).toEqual(false);
    });
    it('should throw if no orgId is set', async () => {
      await expect(
        organizationRolesGuard.validateToken(
          {
            user: {},
          } as AuthenticatedRequest,
          [],
        ),
      ).rejects.toThrow('No organizationId found');
    });
    it('should throw if no org is found', async () => {
      mockGuardDB.getOrg.mockResolvedValueOnce(null);
      await expect(
        organizationRolesGuard.validateToken(
          mockRequest as AuthenticatedRequest,
          [],
        ),
      ).rejects.toThrow('Organization not found');
    });
    it("should throw if user doesn't belong to org", async () => {
      mockGuardDB.getUserOrgRole.mockResolvedValueOnce(null);
      await expect(
        organizationRolesGuard.validateToken(
          mockRequest as AuthenticatedRequest,
          [],
        ),
      ).rejects.toThrow('You do not have access to the active organization');
    });
    it('should throw if role not in requiredRoles', async () => {
      await expect(
        organizationRolesGuard.validateToken(
          mockRequest as AuthenticatedRequest,
          [OrganizationRole.OWNER, OrganizationRole.ADMIN],
        ),
      ).rejects.toThrow(
        'You do not have the required role to access this resource',
      );
    });
    it('should set clsService orgRole', async () => {
      await organizationRolesGuard.validateToken(
        mockRequest as AuthenticatedRequest,
        [
          OrganizationRole.OWNER,
          OrganizationRole.ADMIN,
          OrganizationRole.MEMBER,
        ],
      );
      expect(mockClsService.set).toHaveBeenCalledWith(
        'orgRole',
        OrganizationRole.MEMBER,
      );
    });
  });
});
