import { Test } from '@nestjs/testing';
import { InviteService } from '../../src/invite/invite.service';
import { AuthService } from '../../src/auth/auth.service';
import { ClsService } from 'nestjs-cls';
import { InviteEntity } from '../../src/invite/invite.entity';
import { WarehouseEntity } from '../../src/warehouse/warehouse.entity';
import { UserEntity } from '../../src/user/user.entity';
import { TxRepoProvider } from '../../src/rls/txrepo.service';
import { ConfigService } from '@nestjs/config';
import * as helper from '../../src/utils/helper';
import { mapRow } from '../../src/utils/helper';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { IsNull } from 'typeorm';
import { OrganizationRole } from '@shared/enum/organizationRoles.enum';

jest.mock('../../src/utils/helper', () => ({
  mapRow: jest.fn().mockReturnValue({
    inviteId: 'invite-1',
    email: 'example@example.org',
    orgId: 'org-1',
    warehouseId: 'warehouse-1',
    role: 'member',
    tokenHash: 'mocked-hashed-token',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    createdAt: new Date(Date.now() + 1000 * 60 * 60),
  }),
}));

describe('InviteService', () => {
  let inviteService: InviteService;
  let actorOrgRole = 'admin';
  const mockConfigService = {
    get: jest.fn<number, [string]>((key: string) => {
      if (key === 'email.inviteTokenExpiresHours') {
        return 24;
      }
      if (key === 'email.registerTokenExpiresMinutes') {
        return 30;
      }
      throw new Error(`Unexpected config key accessed: ${key}`);
    }),
  };
  const mockClsService = {
    get: jest.fn((field: string) => {
      if (field === 'warehouseId') {
        return 'warehouse-1';
      }
      if (field === 'orgId') {
        return 'org-1';
      }
      if (field === 'orgRole') {
        return actorOrgRole;
      }
      throw new Error('Unexpected field');
    }),
    set: jest.fn(),
  };
  const mockInviteRepository = {
    create: jest.fn((inputValue: InviteEntity) => {
      return {
        ...inputValue,
        inviteId: 'invite-1',
      };
    }),
    save: jest.fn((inputValue: InviteEntity) => inputValue),
    delete: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    query: jest.fn().mockReturnValue([
      {
        invite_id: 'invite-1',
        email: 'example@example.org',
        org_id: 'org-1',
        warehouse_id: 'warehouse-1',
        role: 'owner',
        token_hash: 'mocked-hashed-token',
        expires_at: new Date(),
        created_at: new Date(),
      },
    ]),
  };
  const mockWarehouseRepository = {
    findOne: jest.fn().mockResolvedValue({}),
  };
  const mockUserRepository = {
    findOne: jest.fn().mockReturnValue(null),
    save: jest.fn(),
    create: jest.fn((inputValue: InviteEntity) => {
      return {
        ...inputValue,
        userId: 'user-1',
      };
    }),
  };
  const mockTxRepoProvider = {
    getRepo: jest.fn((entity) => {
      if (entity === InviteEntity) {
        return mockInviteRepository;
      }
      if (entity === WarehouseEntity) {
        return mockWarehouseRepository;
      }
      if (entity === UserEntity) {
        return mockUserRepository;
      }
      throw new Error('Unexpected entity type');
    }),
    getManager: jest.fn().mockReturnValue({
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
    }),
  };
  const mockAuthService = {
    generateRandomToken: jest.fn().mockReturnValue('mocked-random-token'),
    hashToken: jest.fn().mockReturnValue('mocked-hashed-token'),
    hashPassword: jest.fn().mockReturnValue('mocked-hashed-password'),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    actorOrgRole = 'admin';
    const moduleRef = await Test.createTestingModule({
      providers: [
        InviteService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: ClsService, useValue: mockClsService },
        { provide: TxRepoProvider, useValue: mockTxRepoProvider },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    inviteService = moduleRef.get<InviteService>(InviteService);
  });
  it('should be defined', () => {
    expect(inviteService).toBeDefined();
  });
  describe('inviteWarehouseUser', () => {
    it('should read warehouseId from clsService', async () => {
      await inviteService.inviteWarehouseUser('example@example.org', 'member');
      expect(mockClsService.get).toHaveBeenCalledWith('warehouseId');
    });
    it('should read orgId from clsService', async () => {
      await inviteService.inviteWarehouseUser('example@example.org', 'member');
      expect(mockClsService.get).toHaveBeenCalledWith('orgId');
    });
    it('should throw an error if warehouse is not found', async () => {
      mockWarehouseRepository.findOne.mockReturnValueOnce(null);
      await expect(
        inviteService.inviteWarehouseUser('example@example.org', 'member'),
      ).rejects.toThrow(new NotFoundException('Warehouse not found'));
    });
    it('should call authService generateRandomToken', async () => {
      await inviteService.inviteWarehouseUser('example@example.org', 'member');
      expect(mockAuthService.generateRandomToken).toHaveBeenCalled();
    });
    it('should call authService hashToken', async () => {
      await inviteService.inviteWarehouseUser('example@example.org', 'member');
      expect(mockAuthService.hashToken).toHaveBeenCalled();
    });
    it('should call inviteRepo create with correct parameters', async () => {
      await inviteService.inviteWarehouseUser('example@example.org', 'member');
      expect(mockInviteRepository.create).toHaveBeenCalledWith({
        email: 'example@example.org',
        orgId: 'org-1',
        warehouseId: 'warehouse-1',
        role: 'member',

        expiresAt: expect.any(Date),
        tokenHash: 'mocked-hashed-token',
      });
    });
    it('should calculate expiresAt correctly', async () => {
      const response = await inviteService.inviteWarehouseUser(
        'example@example.org',
        'member',
      );
      const inviteTokenExpirationHours = mockConfigService.get(
        'email.inviteTokenExpiresHours',
      );
      const expiresAt = new Date(
        Date.now() + inviteTokenExpirationHours * 60 * 60 * 1000,
      );
      const maxDifferenceInMilliseconds = 1000;
      expect(
        Math.abs(expiresAt.valueOf() - response.invite.expiresAt.valueOf()),
      ).toBeLessThan(maxDifferenceInMilliseconds);
    });
    it('should call inviteRepo save with correct parameters', async () => {
      await inviteService.inviteWarehouseUser('example@example.org', 'member');
      expect(mockInviteRepository.save).toHaveBeenCalledWith({
        email: 'example@example.org',
        orgId: 'org-1',
        warehouseId: 'warehouse-1',
        role: 'member',

        expiresAt: expect.any(Date),
        tokenHash: 'mocked-hashed-token',
        inviteId: 'invite-1',
      });
    });
    it('should return saved invite and raw invite token', async () => {
      const response = await inviteService.inviteWarehouseUser(
        'example@example.org',
        'member',
      );
      expect(response.invite).toMatchObject({
        email: 'example@example.org',
        orgId: 'org-1',
        warehouseId: 'warehouse-1',
        role: 'member',

        expiresAt: expect.any(Date),
        tokenHash: 'mocked-hashed-token',
        inviteId: 'invite-1',
      });
      expect(response.rawToken).toEqual('mocked-random-token');
    });
  });
  describe('acceptInvite', () => {
    it('should call authService hashToken', async () => {
      await inviteService.acceptInvite('rawToken', {
        username: 'username',
        password: 'password1',
      });
      expect(mockAuthService.hashToken).toHaveBeenCalled();
    });
    it('should call consume invite with correct parameters', async () => {
      await inviteService.acceptInvite('rawToken', {
        username: 'username',
        password: 'password1',
      });

      expect(mockTxRepoProvider.getManager().query).toHaveBeenCalledWith(
        'SELECT * FROM consume_invite($1, $2, $3, $4)',
        ['mocked-hashed-token', null, null, true],
      );
    });
    it('should call grant invite role with correct parameters', async () => {
      await inviteService.acceptInvite('rawToken', {
        username: 'username',
        password: 'password1',
      });

      expect(mockTxRepoProvider.getManager().query).toHaveBeenCalledWith(
        'SELECT grant_invite_role($1, $2, $3, $4)',
        ['user-1', 'org-1', 'warehouse-1', 'member'],
      );
    });
    it('should throw error if no invite is found', async () => {
      mockTxRepoProvider.getManager().query.mockImplementationOnce(() => {
        return new Promise(() => {
          throw new Error('invite_invalid_or_expired');
        });
      });
      await expect(
        inviteService.acceptInvite('rawToken', {
          username: 'username',
          password: 'password1',
        }),
      ).rejects.toThrow(new BadRequestException('Invite invalid or expired'));
    });
    it('should call mapRow', async () => {
      await inviteService.acceptInvite('rawToken', {
        username: 'username',
        password: 'password1',
      });
      expect(mapRow).toHaveBeenCalled();
    });
    it('should throw an error if a user with that email already exists', async () => {
      mockUserRepository.findOne.mockReturnValueOnce({
        email: 'user@example.org',
        username: 'user',
        password: 'password1',
      });
      await expect(
        inviteService.acceptInvite('rawToken', {
          username: 'username',
          password: 'password1',
        }),
      ).rejects.toThrow(new BadRequestException('User already exists'));
    });
    it('should create a new user with hashed password', async () => {
      await inviteService.acceptInvite('rawToken', {
        username: 'username',
        password: 'password1',
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'example@example.org',
        username: 'username',
        password: 'mocked-hashed-password',
      });
    });
    it('should save new user', async () => {
      await inviteService.acceptInvite('rawToken', {
        username: 'username',
        password: 'password1',
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        userId: 'user-1',
        email: 'example@example.org',
        username: 'username',
        password: 'mocked-hashed-password',
      });
    });
    it('should return saved user', async () => {
      const response = await inviteService.acceptInvite('rawToken', {
        username: 'username',
        password: 'password1',
      });
      expect(response).toMatchObject({
        userId: 'user-1',
        email: 'example@example.org',
        username: 'username',
        password: 'mocked-hashed-password',
      });
    });
  });
  describe('inviteOrganizationRegister', () => {
    it('should throw an error if a user with that email already exists', async () => {
      mockUserRepository.findOne.mockReturnValueOnce({
        email: 'example@example.org',
        username: 'username',
        password: 'password1',
      });
      await expect(
        inviteService.inviteOrganizationRegister('example@example.org'),
      ).rejects.toThrow(new BadRequestException('User already exists'));
    });
    it('should call authService generateRandomToken', async () => {
      await inviteService.inviteOrganizationRegister('example@example.org');
      expect(mockAuthService.generateRandomToken).toHaveBeenCalled();
    });
    it('should call authService hashToken', async () => {
      await inviteService.inviteOrganizationRegister('example@example.org');
      expect(mockAuthService.hashToken).toHaveBeenCalled();
    });
    it('should call create org registration with correct parameters', async () => {
      await inviteService.inviteOrganizationRegister('example@example.org');
      expect(mockInviteRepository.query).toHaveBeenCalledWith(
        'SELECT * from create_org_registration($1, $2, $3)',
        ['example@example.org', 'mocked-hashed-token', expect.any(Date)],
      );
    });
    it('should calculate expiresAt correctly', async () => {
      await inviteService.inviteOrganizationRegister('example@example.org');
      const registerDurationMinutes = mockConfigService.get(
        'email.registerTokenExpiresMinutes',
      );
      const expiresAt = new Date(
        Date.now() + registerDurationMinutes * 60 * 1000,
      );
      const maxDifferenceInMilliseconds = 1000;
      const calledExpiresAt: Date =
        mockInviteRepository.query.mock.calls[0][1][2];
      expect(
        Math.abs(expiresAt.valueOf() - calledExpiresAt.valueOf()),
      ).toBeLessThan(maxDifferenceInMilliseconds);
    });
    it('should return created invite and rawToken', async () => {
      const response = await inviteService.inviteOrganizationRegister(
        'example@example.org',
      );
      expect(response).toMatchObject({
        invite: {
          inviteId: 'invite-1',
          email: 'example@example.org',
          orgId: 'org-1',
          warehouseId: 'warehouse-1',
          role: 'member',
          tokenHash: 'mocked-hashed-token',
          expiresAt: expect.any(Date),
          createdAt: expect.any(Date),
        },
        rawToken: 'mocked-random-token',
      });
    });
  });
  describe('validateToken', () => {
    it('should call authService hashToken', async () => {
      await inviteService.validateInvite('rawToken');
      expect(mockAuthService.hashToken).toHaveBeenCalled();
    });
    it('should throw if no invite is found', async () => {
      mockInviteRepository.query.mockReturnValueOnce([null]);
      await expect(inviteService.validateInvite('rawToken')).rejects.toThrow(
        new BadRequestException('Invite invalid or expired'),
      );
    });
    it('should call validate invite with correct parameters', async () => {
      await inviteService.validateInvite('rawToken');
      expect(mockInviteRepository.query).toHaveBeenCalledWith(
        'SELECT * FROM validate_invite($1)',
        ['mocked-hashed-token'],
      );
    });
    it('should call mapRow with found invite', async () => {
      const mockInvite = {
        inviteId: 'invite-1',
        email: 'example@example.org',
        orgId: 'org-1',
        warehouseId: 'warehouse-1',
        role: 'member',
        tokenHash: 'mocked-hashed-token',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      };
      mockInviteRepository.query.mockReturnValueOnce([mockInvite]);
      await inviteService.validateInvite('rawToken');
      expect(helper.mapRow).toHaveBeenCalledWith(
        mockInviteRepository,
        mockInvite,
      );
    });
    it('should return output of mapRow', async () => {
      const response = await inviteService.validateInvite('rawToken');
      expect(response).toMatchObject({
        inviteId: 'invite-1',
        email: 'example@example.org',
        orgId: 'org-1',
        warehouseId: 'warehouse-1',
        role: 'member',
        tokenHash: 'mocked-hashed-token',

        expiresAt: expect.any(Date),
      });
    });
  });
  describe('inviteOrganizationUser', () => {
    it('should create an org-only invite with the org role', async () => {
      await inviteService.inviteOrganizationUser(
        'example@example.org',
        OrganizationRole.ADMIN,
      );
      expect(mockInviteRepository.create).toHaveBeenCalledWith({
        email: 'example@example.org',
        orgId: 'org-1',
        role: 'admin',
        expiresAt: expect.any(Date),
        tokenHash: 'mocked-hashed-token',
      });
    });
    it('should return saved invite and raw invite token', async () => {
      const response = await inviteService.inviteOrganizationUser(
        'example@example.org',
        OrganizationRole.MEMBER,
      );
      expect(response.invite).toMatchObject({
        inviteId: 'invite-1',
        role: 'member',
      });
      expect(response.invite.warehouseId).toBeUndefined();
      expect(response.rawToken).toEqual('mocked-random-token');
    });
    it('should remove older pending invites for the same email', async () => {
      await inviteService.inviteOrganizationUser(
        'example@example.org',
        OrganizationRole.MEMBER,
      );
      expect(mockInviteRepository.delete).toHaveBeenCalledWith({
        email: 'example@example.org',
        orgId: 'org-1',
        consumedAt: IsNull(),
      });
    });
    it('should throw if the user already exists', async () => {
      mockUserRepository.findOne.mockReturnValueOnce({ userId: 'user-2' });
      await expect(
        inviteService.inviteOrganizationUser(
          'example@example.org',
          OrganizationRole.MEMBER,
        ),
      ).rejects.toThrow(new BadRequestException('User already exists'));
      expect(mockInviteRepository.save).not.toHaveBeenCalled();
    });
    it('should not allow admins to invite owners', async () => {
      await expect(
        inviteService.inviteOrganizationUser(
          'example@example.org',
          OrganizationRole.OWNER,
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'You do not have permission to invite users with this role',
        ),
      );
      expect(mockInviteRepository.save).not.toHaveBeenCalled();
    });
    it('should allow owners to invite owners', async () => {
      actorOrgRole = 'owner';
      await inviteService.inviteOrganizationUser(
        'example@example.org',
        OrganizationRole.OWNER,
      );
      expect(mockInviteRepository.save).toHaveBeenCalled();
    });
    it('should not allow members to invite anyone', async () => {
      actorOrgRole = 'member';
      await expect(
        inviteService.inviteOrganizationUser(
          'example@example.org',
          OrganizationRole.MEMBER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
  describe('getPendingInvites', () => {
    it('should query unconsumed invites of the current org', async () => {
      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ inviteId: 'invite-1' }]),
      };
      mockInviteRepository.createQueryBuilder.mockReturnValueOnce(queryBuilder);
      const response = await inviteService.getPendingInvites();
      expect(queryBuilder.where).toHaveBeenCalledWith('invite.orgId = :orgId', {
        orgId: 'org-1',
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'invite.consumedAt IS NULL',
      );
      expect(response).toEqual([{ inviteId: 'invite-1' }]);
    });
  });
  describe('revokeInvite', () => {
    it('should look up the invite in the current org', async () => {
      mockInviteRepository.findOne.mockResolvedValueOnce({
        inviteId: 'invite-1',
        warehouseId: null,
        role: 'member',
      });
      await inviteService.revokeInvite('invite-1');
      expect(mockInviteRepository.findOne).toHaveBeenCalledWith({
        where: { inviteId: 'invite-1', orgId: 'org-1', consumedAt: IsNull() },
      });
    });
    it('should delete the invite', async () => {
      mockInviteRepository.findOne.mockResolvedValueOnce({
        inviteId: 'invite-1',
        warehouseId: null,
        role: 'member',
      });
      await inviteService.revokeInvite('invite-1');
      expect(mockInviteRepository.delete).toHaveBeenCalledWith({
        inviteId: 'invite-1',
      });
    });
    it('should throw if the invite is not found', async () => {
      mockInviteRepository.findOne.mockResolvedValueOnce(null);
      await expect(inviteService.revokeInvite('invite-1')).rejects.toThrow(
        new NotFoundException('Invite not found'),
      );
      expect(mockInviteRepository.delete).not.toHaveBeenCalled();
    });
    it('should not allow admins to revoke owner invites', async () => {
      mockInviteRepository.findOne.mockResolvedValueOnce({
        inviteId: 'invite-1',
        warehouseId: null,
        role: 'owner',
      });
      await expect(inviteService.revokeInvite('invite-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockInviteRepository.delete).not.toHaveBeenCalled();
    });
    it('should allow admins to revoke warehouse invites', async () => {
      mockInviteRepository.findOne.mockResolvedValueOnce({
        inviteId: 'invite-1',
        warehouseId: 'warehouse-1',
        role: 'admin',
      });
      await inviteService.revokeInvite('invite-1');
      expect(mockInviteRepository.delete).toHaveBeenCalled();
    });
  });
  describe('resendInvite', () => {
    it('should save the invite with a new token and expiry', async () => {
      mockInviteRepository.findOne.mockResolvedValueOnce({
        inviteId: 'invite-1',
        warehouseId: null,
        role: 'member',
        tokenHash: 'old-hash',
        expiresAt: new Date(Date.now() - 1000),
      });
      const response = await inviteService.resendInvite('invite-1');
      expect(response.invite.tokenHash).toEqual('mocked-hashed-token');
      expect(response.invite.expiresAt.valueOf()).toBeGreaterThan(Date.now());
      expect(response.rawToken).toEqual('mocked-random-token');
    });
    it('should throw if the invite is not found', async () => {
      mockInviteRepository.findOne.mockResolvedValueOnce(null);
      await expect(inviteService.resendInvite('invite-1')).rejects.toThrow(
        new NotFoundException('Invite not found'),
      );
      expect(mockInviteRepository.save).not.toHaveBeenCalled();
    });
  });
});
