import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from '../../src/organization/organization.service';
import { TxRepoProvider } from '../../src/rls/txrepo.service';
import { AuthService } from '../../src/auth/auth.service';
import { ClsService } from 'nestjs-cls';
import { InviteEntity } from '../../src/invite/invite.entity';
import { OrganizationEntity } from '../../src/organization/organization.entity';
import { UserEntity } from '../../src/user/user.entity';
import * as helper from '../../src/utils/helper';
import { FindOneOptions } from 'typeorm';
import { UserOrganizationRoleEntity } from '../../src/userOrganizationRole/userOrganizationRole.entity';
jest.mock('../../src/utils/helper', () => ({
  mapRow: jest.fn(),
}));

describe('OrganizationService', () => {
  let organizationService: OrganizationService;
  const mockTxRepoProvider = {
    getRepo: jest.fn().mockImplementation((entity) => {
      if (entity === InviteEntity) {
        return mockInviteRepository;
      }
      if (entity === OrganizationEntity) {
        return mockOrganizationRepository;
      }
      if (entity === UserEntity) {
        return mockUserRepository;
      }
      if (entity === UserOrganizationRoleEntity) {
        return mockUserOrganizationRoleRepository;
      }
      throw new Error('Unexpected entity type');
    }),
  };
  const mockAuthService = {
    hashToken: jest.fn().mockReturnValue('mocked-hashed-token'),
    hashPassword: jest.fn().mockResolvedValue('mocked-hashed-password'),
  };
  const mockClsService = {
    get: jest.fn().mockImplementation((target: string) => {
      if (target === 'orgId') {
        return 'org-1';
      }
      throw new Error('Unexpected target');
    }),
    set: jest.fn(),
  };
  const mockInviteRepository = {
    query: jest.fn().mockResolvedValue([
      {
        invite_id: 'invite-1',
        email: 'example@example.org',
        org_id: 'org-1',
        warehouse_id: 'warehouse-1',
        role: 'member',
        token_hash: 'mocked-hashed-token',
        expires_at: new Date(Date.now() + 1000 * 60 * 60),
      },
    ]),
  };
  const mockOrganizationRepository = {
    query: jest.fn().mockResolvedValue([
      {
        org_id: 'org-1',
        name: 'organization',
        created_at: new Date(),
      },
    ]),
    findOne: jest.fn().mockResolvedValue({
      orgId: 'org-1',
      name: 'organization',
      createdAt: new Date(),
    }),
  };
  const mockUserOrganizationRoleRepository = {
    createQueryBuilder: jest.fn().mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
      getRawMany: jest.fn().mockResolvedValue([
        {
          userId: 'user-1',
          orgId: 'org-1',
          role: 'member',
        },
      ]),
      andWhere: jest.fn().mockReturnThis(),
    }),
  };
  const mockUserRepository = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((user: UserEntity) => {
      return {
        userId: 'user-1',
        ...user,
      };
    }),
    save: jest.fn().mockImplementation((user: UserEntity) => user),
  };
  (helper.mapRow as jest.Mock).mockReturnValue({
    orgId: 'org-1',
    name: 'organization',
    createdAt: new Date(),
  });
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        { provide: TxRepoProvider, useValue: mockTxRepoProvider },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();

    organizationService = module.get<OrganizationService>(OrganizationService);
  });
  it('should be defined', () => {
    expect(organizationService).toBeDefined();
  });
  describe('createOrganization', () => {
    it('should call authService hashToken', async () => {
      await organizationService.createOrganization('rawToken', {
        name: 'organization',
        ownerEmail: 'example@example.org',
        ownerUsername: 'username',
        ownerPassword: 'password1',
      });
      expect(mockAuthService.hashToken).toHaveBeenCalledWith('rawToken');
    });
    it('should call inviteRepository query with correct parameters', async () => {
      await organizationService.createOrganization('rawToken', {
        name: 'organization',
        ownerEmail: 'example@example.org',
        ownerUsername: 'username',
        ownerPassword: 'password1',
      });
      expect(mockInviteRepository.query).toHaveBeenCalledWith(
        'SELECT consume_invite($1, $2, $3, $4) AS invite',
        ['mocked-hashed-token', true, 'example@example.org', false],
      );
    });
    it('should throw if no invite is found', async () => {
      mockInviteRepository.query.mockReturnValueOnce([]);
      await expect(
        organizationService.createOrganization('rawToken', {
          name: 'organization',
          ownerEmail: 'example@example.org',
          ownerUsername: 'username',
          ownerPassword: 'password1',
        }),
      ).rejects.toThrow('Invalid or expired token');
    });
    it('should throw if email already used', async () => {
      mockUserRepository.findOne.mockImplementationOnce(
        (findOneOptions: FindOneOptions) => {
          if (findOneOptions.where['email'] === 'example@example.org') {
            return {
              userId: 'user-1',
              email: 'example@example.org',
              username: 'username',
              password: 'password1',
            };
          }
          return null;
        },
      );
      await expect(
        organizationService.createOrganization('rawToken', {
          name: 'organization',
          ownerEmail: 'example@example.org',
          ownerUsername: 'username',
          ownerPassword: 'password1',
        }),
      ).rejects.toThrow('User with this email already exists');
    });
    it('should throw if username already used', async () => {
      mockUserRepository.findOne
        .mockImplementationOnce((findOneOptions: FindOneOptions) => {
          if (findOneOptions.where['username'] === 'username') {
            return {
              userId: 'user-1',
              email: 'example@example.org',
              username: 'username',
              password: 'password1',
            };
          }
          return null;
        })
        .mockImplementationOnce((findOneOptions: FindOneOptions) => {
          if (findOneOptions.where['username'] === 'username') {
            return {
              userId: 'user-1',
              email: 'example@example.org',
              username: 'username',
              password: 'password1',
            };
          }
          return null;
        });
      await expect(
        organizationService.createOrganization('rawToken', {
          name: 'organization',
          ownerEmail: 'example@example.org',
          ownerUsername: 'username',
          ownerPassword: 'password1',
        }),
      ).rejects.toThrow('User with this username already exists');
    });
    it('should call authService hashPassword', async () => {
      await organizationService.createOrganization('rawToken', {
        name: 'organization',
        ownerEmail: 'example@example.org',
        ownerUsername: 'username',
        ownerPassword: 'password1',
      });
      expect(mockAuthService.hashPassword).toHaveBeenCalledWith('password1');
    });
    it('should create new user with hashed password', async () => {
      await organizationService.createOrganization('rawToken', {
        name: 'organization',
        ownerEmail: 'example@example.org',
        ownerUsername: 'username',
        ownerPassword: 'password1',
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'example@example.org',
        username: 'username',
        password: 'mocked-hashed-password',
      });
    });
    it('should save new user', async () => {
      await organizationService.createOrganization('rawToken', {
        name: 'organization',
        ownerEmail: 'example@example.org',
        ownerUsername: 'username',
        ownerPassword: 'password1',
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        userId: 'user-1',
        email: 'example@example.org',
        username: 'username',
        password: 'mocked-hashed-password',
      });
    });
    it('should create new organization', async () => {
      await organizationService.createOrganization('rawToken', {
        name: 'organization',
        ownerEmail: 'example@example.org',
        ownerUsername: 'username',
        ownerPassword: 'password1',
      });
      expect(mockOrganizationRepository.query).toHaveBeenCalledWith(
        `SELECT * FROM create_organization($1, $2)`,
        ['organization', 'user-1'],
      );
    });
    it('should call mapRow on new organization', async () => {
      await organizationService.createOrganization('rawToken', {
        name: 'organization',
        ownerEmail: 'example@example.org',
        ownerUsername: 'username',
        ownerPassword: 'password1',
      });
      expect(helper.mapRow).toHaveBeenCalledWith(mockOrganizationRepository, {
        org_id: 'org-1',
        name: 'organization',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        created_at: expect.any(Date),
      });
    });
    it('should return new user and new organization', async () => {
      const result = await organizationService.createOrganization('rawToken', {
        name: 'organization',
        ownerEmail: 'example@example.org',
        ownerUsername: 'username',
        ownerPassword: 'password1',
      });
      expect(result).toMatchObject({
        user: {
          userId: 'user-1',
          email: 'example@example.org',
          username: 'username',
          password: 'mocked-hashed-password',
        },
        organization: {
          orgId: 'org-1',
          name: 'organization',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          createdAt: expect.any(Date),
        },
      });
    });
  });
  describe('findByOrgId', () => {
    it('should call organizationRepository with orgId', async () => {
      await organizationService.findByOrgId('org-1');
      expect(mockOrganizationRepository.findOne).toHaveBeenCalledWith({
        where: {
          orgId: 'org-1',
        },
      });
    });
    it('should return organizationRepository return value', async () => {
      const result = await organizationService.findByOrgId('org-1');
      expect(result).toEqual({
        orgId: 'org-1',
        name: 'organization',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        createdAt: expect.any(Date),
      });
    });
  });
  describe('getUsers', () => {
    it('should read from clsService', async () => {
      await organizationService.getUsers('', 1);
      expect(mockClsService.get).toHaveBeenCalledWith('orgId');
    });
    it('should use expected query', async () => {
      await organizationService.getUsers('', 1);
      expect(
        mockUserOrganizationRoleRepository.createQueryBuilder,
      ).toHaveBeenCalledWith('user_org_role');
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserOrganizationRoleRepository.createQueryBuilder().innerJoin,
      ).toHaveBeenCalledWith(
        'UserEntity',
        'user',
        'user.userId = user_org_role.userId',
      );
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserOrganizationRoleRepository.createQueryBuilder().where,
      ).toHaveBeenCalledWith('user_org_role.orgId = :orgId', {
        orgId: 'org-1',
      });
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserOrganizationRoleRepository.createQueryBuilder().getCount,
      ).toHaveBeenCalled();
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserOrganizationRoleRepository.createQueryBuilder().select,
      ).toHaveBeenCalledWith([
        'user.userId AS "userId"',
        'user.username AS username',
        'user_org_role.role AS role',
      ]);
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserOrganizationRoleRepository.createQueryBuilder().offset,
      ).toHaveBeenCalledWith(0);
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserOrganizationRoleRepository.createQueryBuilder().limit,
      ).toHaveBeenCalledWith(10);
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserOrganizationRoleRepository.createQueryBuilder().getRawMany,
      ).toHaveBeenCalled();
    });
    it('should use trimmed search term', async () => {
      await organizationService.getUsers('  search  ', 1);
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserOrganizationRoleRepository.createQueryBuilder().andWhere,
      ).toHaveBeenCalledWith('user.username ILIKE :search', {
        search: `%search%`,
      });
    });
    it('should use paging', async () => {
      await organizationService.getUsers('', 2);
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserOrganizationRoleRepository.createQueryBuilder().offset,
      ).toHaveBeenCalledWith(10);
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mockUserOrganizationRoleRepository.createQueryBuilder().limit,
      ).toHaveBeenCalledWith(10);
    });
    it('should return query return value', async () => {
      const result = await organizationService.getUsers('', 1);
      expect(result).toMatchObject({
        data: [
          {
            userId: 'user-1',
            orgId: 'org-1',
            role: 'member',
          },
        ],
        total: 1,
      });
    });
  });
});
