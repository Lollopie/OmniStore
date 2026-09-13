import { Test } from '@nestjs/testing';
import { InviteController } from '../../src/invite/invite.controller';
import { InviteService } from '../../src/invite/invite.service';
import { BadRequestException } from '@nestjs/common';
describe('InviteController', () => {
  const mockInviteService = {
    acceptInvite: jest.fn().mockResolvedValue({
      userId: 'user-1',
      email: 'user@example.org',
      username: 'user',
      password: 'password1',
    }),
  };
  let inviteController: InviteController;
  beforeEach(async () => {
    jest.clearAllMocks();
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
      await expect(
        inviteController.acceptInvite(null, {
          username: 'testuser',
          password: 'testpassword1',
        }),
      ).rejects.toThrow(new BadRequestException('Invite token is required'));
    });
    it("should return invite service's return value", async () => {
      await expect(
        inviteController.acceptInvite('a', {
          username: 'testuser',
          password: 'testpassword1',
        }),
      ).resolves.toEqual({
        userId: 'user-1',
        email: 'user@example.org',
        username: 'user',
        password: 'password1',
      });
    });
  });
});
