import { SubscriptionService } from '../../src/payment/subscription.service';
import { SubscriptionGuard } from '../../src/payment/subscription.guard';
import { OrganizationController } from '../../src/organization/organization.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../../src/auth/auth.guard';
import { CanActivate, NotFoundException } from '@nestjs/common';
import { OrganizationRolesGuard } from '../../src/roles/organizationRoles/organizationRoles.guard';
import { OrganizationService } from '../../src/organization/organization.service';
import { AuthService } from '../../src/auth/auth.service';
import { UserOrganizationRoleService } from '../../src/userOrganizationRole/userOrganizationRole.service';
import { Response } from 'express';
import { OrganizationRole } from '@shared/enum/organizationRoles.enum';
import { InviteService } from '../../src/invite/invite.service';
import { MailService } from '../../src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
describe('OrganizationController', () => {
  let organizationController: OrganizationController;
  class MockGuard implements CanActivate {
    canActivate(): boolean {
      return true;
    }
  }
  const mockOrganizationService = {
    createOrganization: jest.fn().mockResolvedValue({
      user: {
        userId: 'user-1',
        email: 'example@example.org',
        username: 'username',
        password: 'password1',
      },
      organization: {
        orgId: 'org-1',
        name: 'organization',
        createdAt: new Date(),
      },
    }),
    findByOrgId: jest.fn().mockResolvedValue({
      orgId: 'org-1',
      name: 'organization',
    }),
    getUsers: jest.fn().mockResolvedValue({
      data: {
        userId: 'user-1',
        username: 'username',
        role: 'staff',
      },
      total: 1,
    }),
  };
  const mockAuthService = {
    createAndSendCookie: jest.fn(),
    clearCookie: jest.fn(),
  };
  const mockUserOrganizationRoleService = {
    updateUserRole: jest.fn().mockResolvedValue({
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'admin',
    }),
    removeMember: jest.fn(),
  };
  const mockInvite = {
    invite: { inviteId: 'invite-1', email: 'new@example.org' },
    rawToken: 'raw-token',
  };
  const mockInviteService = {
    inviteOrganizationUser: jest.fn().mockResolvedValue(mockInvite),
    resendInvite: jest.fn().mockResolvedValue(mockInvite),
    revokeInvite: jest.fn(),
    getPendingInvites: jest.fn().mockResolvedValue([{ inviteId: 'invite-1' }]),
  };
  const mockMailService = {
    sendInviteEmail: jest.fn(),
  };
  const mockConfigService = {
    get: jest.fn((key: string) =>
      key === 'app.frontendUrl' ? 'http://frontend' : undefined,
    ),
  };
  const mockSubscriptionService = {
    getSubscription: jest.fn(),
    confirmCheckoutSession: jest.fn(),
  };
  const userToken = {
    username: 'username',
    userId: 'user-1',
    orgId: 'org-1',
    activeWarehouseId: '',
    activeRole: '',
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        {
          provide: OrganizationService,
          useValue: mockOrganizationService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UserOrganizationRoleService,
          useValue: mockUserOrganizationRoleService,
        },
        { provide: SubscriptionService, useValue: mockSubscriptionService },
        { provide: InviteService, useValue: mockInviteService },
        { provide: MailService, useValue: mockMailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockGuard)
      .overrideGuard(SubscriptionGuard)
      .useClass(MockGuard)
      .overrideGuard(OrganizationRolesGuard)
      .useClass(MockGuard)
      .compile();

    organizationController = module.get<OrganizationController>(
      OrganizationController,
    );
  });
  it('should be defined', () => {
    expect(organizationController).toBeDefined();
  });
  describe('getSubscription', () => {
    it('should return the current subscription', async () => {
      mockSubscriptionService.getSubscription.mockResolvedValueOnce('starter');
      const response = await organizationController.getSubscription(userToken);
      expect(mockSubscriptionService.getSubscription).toHaveBeenCalledWith(
        'org-1',
      );
      expect(response).toEqual({ subscription: 'starter' });
    });
    it('should not confirm a checkout session if already subscribed', async () => {
      mockSubscriptionService.getSubscription.mockResolvedValueOnce('starter');
      await organizationController.getSubscription(userToken, 'cs_test_1');
      expect(
        mockSubscriptionService.confirmCheckoutSession,
      ).not.toHaveBeenCalled();
    });
    it('should return null without a sessionId if not subscribed', async () => {
      mockSubscriptionService.getSubscription.mockResolvedValueOnce(null);
      const response = await organizationController.getSubscription(userToken);
      expect(
        mockSubscriptionService.confirmCheckoutSession,
      ).not.toHaveBeenCalled();
      expect(response).toEqual({ subscription: null });
    });
    it('should confirm the checkout session and return the new subscription', async () => {
      mockSubscriptionService.getSubscription
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('growth');
      mockSubscriptionService.confirmCheckoutSession.mockResolvedValueOnce(
        true,
      );
      const response = await organizationController.getSubscription(
        userToken,
        'cs_test_1',
      );
      expect(
        mockSubscriptionService.confirmCheckoutSession,
      ).toHaveBeenCalledWith('cs_test_1', 'org-1');
      expect(response).toEqual({ subscription: 'growth' });
    });
    it('should return null if the checkout session is not yet active', async () => {
      mockSubscriptionService.getSubscription.mockResolvedValueOnce(null);
      mockSubscriptionService.confirmCheckoutSession.mockResolvedValueOnce(
        false,
      );
      const response = await organizationController.getSubscription(
        userToken,
        'cs_test_1',
      );
      expect(mockSubscriptionService.getSubscription).toHaveBeenCalledTimes(1);
      expect(response).toEqual({ subscription: null });
    });
  });
  describe('register', () => {
    it('should call organizationService createOrganization', async () => {
      const mockResponse = {} as unknown as Response;
      await organizationController.register(
        'token',
        {
          name: 'organizationName',
          ownerEmail: 'example@example.org',
          ownerUsername: 'username',
          ownerPassword: 'password1',
        },
        mockResponse,
      );
      expect(mockOrganizationService.createOrganization).toHaveBeenCalledWith(
        'token',
        {
          name: 'organizationName',
          ownerEmail: 'example@example.org',
          ownerUsername: 'username',
          ownerPassword: 'password1',
        },
      );
    });
    it('should call authService createAndSendCookie', async () => {
      const mockResponse = {} as unknown as Response;
      await organizationController.register(
        'token',
        {
          name: 'organizationName',
          ownerEmail: 'example@example.org',
          ownerUsername: 'username',
          ownerPassword: 'password1',
        },
        mockResponse,
      );
      expect(mockAuthService.createAndSendCookie).toHaveBeenCalledWith(
        {
          username: 'username',
          userId: 'user-1',
          orgId: 'org-1',
          activeWarehouseId: '',
          activeRole: '',
        },
        mockResponse,
      );
    });
    it('should return message', async () => {
      const mockResponse = {} as unknown as Response;
      const response = await organizationController.register(
        'token',
        {
          name: 'organizationName',
          ownerEmail: 'example@example.org',
          ownerUsername: 'username',
          ownerPassword: 'password1',
        },
        mockResponse,
      );
      expect(response).toEqual({
        message: 'Organization created successfully.',
      });
    });
  });
  describe('getUsers', () => {
    it('should call organizationService getUsers with default parameters', async () => {
      await organizationController.getUsers(null, null);
      expect(mockOrganizationService.getUsers).toHaveBeenCalledWith('', 1);
    });
    it('should call organizationService getUsers with specified parameters', async () => {
      await organizationController.getUsers('search', 2);
      expect(mockOrganizationService.getUsers).toHaveBeenCalledWith(
        'search',
        2,
      );
    });
    it('should return organizationService getUsers return value', async () => {
      const response = await organizationController.getUsers('search', 2);
      expect(response).toEqual({
        data: {
          userId: 'user-1',
          username: 'username',
          role: 'staff',
        },
        total: 1,
      });
    });
  });
  describe('updateUserRole', () => {
    it('should call userOrganizationRoleService updateUserRole', async () => {
      await organizationController.updateUserRole({
        username: 'username',
        role: OrganizationRole.ADMIN,
      });
      expect(
        mockUserOrganizationRoleService.updateUserRole,
      ).toHaveBeenCalledWith('username', 'admin');
    });
    it('should return userOrganizationRoleService updateUserRole return value', async () => {
      const response = await organizationController.updateUserRole({
        username: 'username',
        role: OrganizationRole.ADMIN,
      });
      expect(response).toEqual({
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'admin',
      });
    });
  });
  describe('getInvites', () => {
    it('should return inviteService getPendingInvites return value', async () => {
      const response = await organizationController.getInvites();
      expect(response).toEqual([{ inviteId: 'invite-1' }]);
    });
  });
  describe('inviteUser', () => {
    it('should call inviteService inviteOrganizationUser', async () => {
      await organizationController.inviteUser(
        { email: 'new@example.org', role: OrganizationRole.ADMIN },
        userToken,
      );
      expect(mockInviteService.inviteOrganizationUser).toHaveBeenCalledWith(
        'new@example.org',
        'admin',
      );
    });
    it('should send the invite email with the accept link', async () => {
      await organizationController.inviteUser(
        { email: 'new@example.org', role: OrganizationRole.MEMBER },
        userToken,
      );
      expect(mockOrganizationService.findByOrgId).toHaveBeenCalledWith('org-1');
      expect(mockMailService.sendInviteEmail).toHaveBeenCalledWith(
        'new@example.org',
        {
          organizationName: 'organization',
          verificationUrl: 'http://frontend/invites/accept?token=raw-token',
          expiresInHours: 24,
        },
      );
    });
    it('should throw if the organization is not found', async () => {
      mockOrganizationService.findByOrgId.mockResolvedValueOnce(null);
      await expect(
        organizationController.inviteUser(
          { email: 'new@example.org', role: OrganizationRole.MEMBER },
          userToken,
        ),
      ).rejects.toThrow(new NotFoundException('Organization not found'));
      expect(mockMailService.sendInviteEmail).not.toHaveBeenCalled();
    });
    it('should return message', async () => {
      const response = await organizationController.inviteUser(
        { email: 'new@example.org', role: OrganizationRole.MEMBER },
        userToken,
      );
      expect(response).toEqual({ message: 'Invite sent successfully.' });
    });
  });
  describe('resendInvite', () => {
    it('should call inviteService resendInvite and send the email', async () => {
      const response = await organizationController.resendInvite(
        'invite-1',
        userToken,
      );
      expect(mockInviteService.resendInvite).toHaveBeenCalledWith('invite-1');
      expect(mockMailService.sendInviteEmail).toHaveBeenCalledWith(
        'new@example.org',
        expect.objectContaining({
          verificationUrl: 'http://frontend/invites/accept?token=raw-token',
        }),
      );
      expect(response).toEqual({ message: 'Invite sent successfully.' });
    });
  });
  describe('revokeInvite', () => {
    it('should call inviteService revokeInvite', async () => {
      const response = await organizationController.revokeInvite('invite-1');
      expect(mockInviteService.revokeInvite).toHaveBeenCalledWith('invite-1');
      expect(response).toEqual({ message: 'Invite revoked.' });
    });
  });
  describe('removeUser', () => {
    const mockResponse = {} as unknown as Response;
    it('should call userOrganizationRoleService removeMember', async () => {
      const response = await organizationController.removeUser(
        'user-2',
        userToken,
        mockResponse,
      );
      expect(mockUserOrganizationRoleService.removeMember).toHaveBeenCalledWith(
        'user-2',
      );
      expect(response).toEqual({ message: 'User removed from organization.' });
    });
    it('should keep the cookie when removing someone else', async () => {
      await organizationController.removeUser(
        'user-2',
        userToken,
        mockResponse,
      );
      expect(mockAuthService.clearCookie).not.toHaveBeenCalled();
    });
    it('should clear the cookie when removing yourself', async () => {
      await organizationController.removeUser(
        'user-1',
        userToken,
        mockResponse,
      );
      expect(mockAuthService.clearCookie).toHaveBeenCalledWith(mockResponse);
    });
  });
});
