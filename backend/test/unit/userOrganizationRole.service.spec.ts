import { UserOrganizationRoleService } from '../../src/userOrganizationRole/userOrganizationRole.service';
import { Test, TestingModule } from '@nestjs/testing';
import { UserOrganizationRoleEntity } from '../../src/userOrganizationRole/userOrganizationRole.entity';
import { UserEntity } from '../../src/user/user.entity';
import { TxRepoProvider } from '../../src/rls/txrepo.service';
describe('UserOrganizationRoleService', () => {
  let userOrganizationRoleService: UserOrganizationRoleService;
  const mockTxRepoProvider = {
    getRepo: jest.fn().mockImplementation((entity) => {
      if (entity === UserOrganizationRoleEntity) {
        return mockUserOrganizationRoleRepository;
      }
      if (entity === UserEntity) {
        return mockUserRepository;
      }
      throw new Error(`Unexpected Entity ${entity}`);
    }),
  };
  const mockUserOrganizationRoleRepository = {
    findOne: jest.fn().mockResolvedValue({
      orgId: 'org-1',
      userId: 'user-1',
      role: 'member',
    }),
    save: jest.fn().mockResolvedValue({
      orgId: 'org-1',
      userId: 'user-1',
      role: 'owner',
    }),
  };
  const mockUserRepository = {
    findOne: jest.fn().mockResolvedValue({
      userId: 'user-1',
      email: 'example@example.org',
      username: 'username',
      password: 'password1',
    }),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserOrganizationRoleService,
        { provide: TxRepoProvider, useValue: mockTxRepoProvider },
      ],
    }).compile();

    userOrganizationRoleService = module.get<UserOrganizationRoleService>(
      UserOrganizationRoleService,
    );
  });
  it('should be defined', () => {
    expect(userOrganizationRoleService).toBeDefined();
  });
  describe('updateUserRole', () => {
    it('should check that user exists', async () => {
      await userOrganizationRoleService.updateUserRole('username', 'owner');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          username: 'username',
        },
      });
    });
    it("should throw if user doesn't exist", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);
      await expect(
        userOrganizationRoleService.updateUserRole('username', 'owner'),
      ).rejects.toThrow('User not found');
    });
    it('should get the current userOrgRole', async () => {
      await userOrganizationRoleService.updateUserRole('username', 'owner');
      expect(mockUserOrganizationRoleRepository.findOne).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
        },
      });
    });
    it('should throw if no userOrgRole is found', async () => {
      mockUserOrganizationRoleRepository.findOne.mockResolvedValueOnce(null);
      await expect(
        userOrganizationRoleService.updateUserRole('username', 'owner'),
      ).rejects.toThrow('User not found in organization');
    });
    it('should save with new role', async () => {
      await userOrganizationRoleService.updateUserRole('username', 'owner');
      expect(mockUserOrganizationRoleRepository.save).toHaveBeenCalledWith({
        orgId: 'org-1',
        userId: 'user-1',
        role: 'owner',
      });
    });
    it('should return saved userOrgRole', async () => {
      const result = await userOrganizationRoleService.updateUserRole(
        'username',
        'owner',
      );
      expect(result).toEqual({
        orgId: 'org-1',
        userId: 'user-1',
        role: 'owner',
      });
    });
  });
});
