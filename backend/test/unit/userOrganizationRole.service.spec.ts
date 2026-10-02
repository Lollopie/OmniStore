import { UserOrganizationRoleService } from '../../src/userOrganizationRole/userOrganizationRole.service';
import { Test, TestingModule } from '@nestjs/testing';
import { UserOrganizationRoleEntity } from '../../src/userOrganizationRole/userOrganizationRole.entity';
import { UserEntity } from '../../src/user/user.entity';
import { TxRepoProvider } from '../../src/rls/txrepo.service';
import { ClsService } from 'nestjs-cls';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
describe('UserOrganizationRoleService', () => {
  let userOrganizationRoleService: UserOrganizationRoleService;
  let actorOrgRole = 'owner';
  let targetRole = 'member';
  let ownerCount = 2;
  const mockClsService = {
    get: jest.fn((key: string) => {
      if (key === 'orgId') return 'org-1';
      if (key === 'orgRole') return actorOrgRole;
      throw new Error(`Unexpected key ${key}`);
    }),
  };
  const mockUserOrganizationRoleRepository = {
    findOne: jest.fn(() =>
      Promise.resolve({ orgId: 'org-1', userId: 'user-1', role: targetRole }),
    ),
    count: jest.fn(() => Promise.resolve(ownerCount)),
    save: jest.fn((value: UserOrganizationRoleEntity) =>
      Promise.resolve(value),
    ),
  };
  const mockUserRepository = {
    findOne: jest.fn().mockResolvedValue({
      userId: 'user-1',
      email: 'example@example.org',
      username: 'username',
      password: 'password1',
    }),
    delete: jest.fn(),
  };
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
  const lastOwner = new BadRequestException(
    'An organization must have at least one owner',
  );
  beforeEach(async () => {
    jest.clearAllMocks();
    actorOrgRole = 'owner';
    targetRole = 'member';
    ownerCount = 2;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserOrganizationRoleService,
        { provide: TxRepoProvider, useValue: mockTxRepoProvider },
        { provide: ClsService, useValue: mockClsService },
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
      await userOrganizationRoleService.updateUserRole('username', 'admin');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'username' },
      });
    });
    it("should throw if user doesn't exist", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);
      await expect(
        userOrganizationRoleService.updateUserRole('username', 'owner'),
      ).rejects.toThrow(new NotFoundException('User not found'));
    });
    it('should look up the membership in the current organization', async () => {
      await userOrganizationRoleService.updateUserRole('username', 'admin');
      expect(mockUserOrganizationRoleRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-1', orgId: 'org-1' },
      });
    });
    it('should throw if no userOrgRole is found', async () => {
      mockUserOrganizationRoleRepository.findOne.mockResolvedValueOnce(null);
      await expect(
        userOrganizationRoleService.updateUserRole('username', 'owner'),
      ).rejects.toThrow(
        new NotFoundException('User not found in organization'),
      );
    });
    it('should save and return the new role', async () => {
      const result = await userOrganizationRoleService.updateUserRole(
        'username',
        'owner',
      );
      expect(mockUserOrganizationRoleRepository.save).toHaveBeenCalledWith({
        orgId: 'org-1',
        userId: 'user-1',
        role: 'owner',
      });
      expect(result).toEqual({
        orgId: 'org-1',
        userId: 'user-1',
        role: 'owner',
      });
    });
    it('should not allow admins to promote to owner', async () => {
      actorOrgRole = 'admin';
      await expect(
        userOrganizationRoleService.updateUserRole('username', 'owner'),
      ).rejects.toThrow(
        new ForbiddenException(
          'You do not have permission to manage users with this role',
        ),
      );
      expect(mockUserOrganizationRoleRepository.save).not.toHaveBeenCalled();
    });
    it('should not allow admins to change owners', async () => {
      actorOrgRole = 'admin';
      targetRole = 'owner';
      await expect(
        userOrganizationRoleService.updateUserRole('username', 'member'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockUserOrganizationRoleRepository.save).not.toHaveBeenCalled();
    });
    it('should allow admins to change admins and members', async () => {
      actorOrgRole = 'admin';
      targetRole = 'admin';
      await userOrganizationRoleService.updateUserRole('username', 'member');
      expect(mockUserOrganizationRoleRepository.save).toHaveBeenCalled();
    });
    it('should not allow members to change roles', async () => {
      actorOrgRole = 'member';
      await expect(
        userOrganizationRoleService.updateUserRole('username', 'member'),
      ).rejects.toThrow(ForbiddenException);
    });
    it('should not demote the last owner', async () => {
      targetRole = 'owner';
      ownerCount = 1;
      await expect(
        userOrganizationRoleService.updateUserRole('username', 'admin'),
      ).rejects.toThrow(lastOwner);
      expect(mockUserOrganizationRoleRepository.save).not.toHaveBeenCalled();
    });
    it('should demote an owner if another owner remains', async () => {
      targetRole = 'owner';
      await userOrganizationRoleService.updateUserRole('username', 'admin');
      expect(mockUserOrganizationRoleRepository.count).toHaveBeenCalledWith({
        where: { orgId: 'org-1', role: 'owner' },
      });
      expect(mockUserOrganizationRoleRepository.save).toHaveBeenCalled();
    });
  });
  describe('removeMember', () => {
    it('should delete the user account', async () => {
      await userOrganizationRoleService.removeMember('user-1');
      expect(mockUserRepository.delete).toHaveBeenCalledWith({
        userId: 'user-1',
      });
    });
    it('should throw if the user is not in the organization', async () => {
      mockUserOrganizationRoleRepository.findOne.mockResolvedValueOnce(null);
      await expect(
        userOrganizationRoleService.removeMember('user-1'),
      ).rejects.toThrow(
        new NotFoundException('User not found in organization'),
      );
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });
    it('should not allow admins to remove owners', async () => {
      actorOrgRole = 'admin';
      targetRole = 'owner';
      await expect(
        userOrganizationRoleService.removeMember('user-1'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });
    it('should not remove the last owner', async () => {
      targetRole = 'owner';
      ownerCount = 1;
      await expect(
        userOrganizationRoleService.removeMember('user-1'),
      ).rejects.toThrow(lastOwner);
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });
  });
  describe('assertNotLastOwner', () => {
    it('should pass for non-owners without counting owners', async () => {
      await userOrganizationRoleService.assertNotLastOwner('user-1', 'org-1');
      expect(mockUserOrganizationRoleRepository.count).not.toHaveBeenCalled();
    });
    it('should pass if the user has no membership', async () => {
      mockUserOrganizationRoleRepository.findOne.mockResolvedValueOnce(null);
      await expect(
        userOrganizationRoleService.assertNotLastOwner('user-1', 'org-1'),
      ).resolves.toBeUndefined();
    });
    it('should throw for the last owner', async () => {
      targetRole = 'owner';
      ownerCount = 1;
      await expect(
        userOrganizationRoleService.assertNotLastOwner('user-1', 'org-1'),
      ).rejects.toThrow(lastOwner);
    });
  });
});
