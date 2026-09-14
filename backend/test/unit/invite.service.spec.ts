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
import { BadRequestException, NotFoundException } from '@nestjs/common';

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
});
