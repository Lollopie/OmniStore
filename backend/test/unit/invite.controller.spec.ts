import { Test } from '@nestjs/testing';
import { InviteController } from '../../src/invite/invite.controller';
import { InviteService } from '../../src/invite/invite.service';
import { UserEntity } from '../../src/user/user.entity';
describe('InviteController', () => {
  const mockInviteService = {
    acceptInvite: jest.fn(),
  };
  let inviteController: InviteController;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [InviteController],
      providers: [{ provide: InviteService, useValue: mockInviteService }],
    }).compile();
    inviteController = moduleRef.get<InviteController>(InviteController);
  });
  it('should be defined', () => {
    expect(inviteController).toBeDefined();
  });
  describe('acceptInvite', () => {
    it('should throw an error if no invite token is provided', async () => {
      const registerDto = {
        username: 'testuser',
        password: 'testpassword1',
      };
      await expect(
        inviteController.acceptInvite(null, registerDto),
      ).rejects.toThrow('Invite token is required');
    });
    it("should return invite service's return value", async () => {
      const registerDto = {
        username: 'testuser',
        password: 'testpassword1',
      };
      const mockUser: UserEntity = {
        userId: 'user-1',
        email: 'user@example.org',
        username: 'user',
        password: 'password1',
      };
      mockInviteService.acceptInvite.mockReturnValue(mockUser);
      await expect(
        inviteController.acceptInvite('a', registerDto),
      ).resolves.toEqual(mockUser);
    });
  });
});
