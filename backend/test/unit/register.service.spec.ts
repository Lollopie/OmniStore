import { RegisterService } from '../../src/register/register.service';
import { Test, TestingModule } from '@nestjs/testing';
import { InviteService } from '../../src/invite/invite.service';
describe('RegisterService', () => {
  let registerService: RegisterService;
  const mockInviteService = {
    inviteOrganizationRegister: jest.fn().mockResolvedValue({
      invite: {
        invite_id: 'invite-1',
        email: 'example@example.org',
        org_id: 'org-1',
        warehouse_id: 'warehouse-1',
        role: 'member',
        token_hash: 'mocked-hashed-token',
        expires_at: new Date(Date.now() + 1000 * 60 * 60),
      },
      rawToken: 'mocked-raw-token',
    }),
    validateInvite: jest.fn().mockResolvedValue({
      invite_id: 'invite-1',
      email: 'example@example.org',
      org_id: 'org-1',
      warehouse_id: 'warehouse-1',
      role: 'member',
      token_hash: 'mocked-hashed-token',
      expires_at: new Date(Date.now() + 1000 * 60 * 60),
    }),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterService,
        { provide: InviteService, useValue: mockInviteService },
      ],
    }).compile();

    registerService = module.get<RegisterService>(RegisterService);
  });
  it('should be defined', () => {
    expect(registerService).toBeDefined();
  });
  describe('register', () => {
    it('should call inviteService inviteOrganizationRegister with email', async () => {
      await registerService.register({
        email: 'example@example.org',
      });
      expect(mockInviteService.inviteOrganizationRegister).toHaveBeenCalledWith(
        'example@example.org',
      );
    });
    it("should return inviteService inviteOrganizationRegister's return value", async () => {
      const result = await registerService.register({
        email: 'example@example.org',
      });
      expect(result).toEqual({
        invite: {
          invite_id: 'invite-1',
          email: 'example@example.org',
          org_id: 'org-1',
          warehouse_id: 'warehouse-1',
          role: 'member',
          token_hash: 'mocked-hashed-token',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          expires_at: expect.any(Date),
        },
        rawToken: 'mocked-raw-token',
      });
    });
  });
  describe('verifyToken', () => {
    it('should call inviteService validateInvite with token', async () => {
      await registerService.verifyToken('mocked-raw-token');
      expect(mockInviteService.validateInvite).toHaveBeenCalledWith(
        'mocked-raw-token',
      );
    });
    it("should return inviteService validateInvite's return value", async () => {
      const result = await registerService.verifyToken('mocked-raw-token');
      expect(result).toEqual({
        invite_id: 'invite-1',
        email: 'example@example.org',
        org_id: 'org-1',
        warehouse_id: 'warehouse-1',
        role: 'member',
        token_hash: 'mocked-hashed-token',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expires_at: expect.any(Date),
      });
    });
  });
});
