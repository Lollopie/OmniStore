import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import Stripe from 'stripe';
import { SubscriptionService } from '../../src/payment/subscription.service';
import { GuardDBService } from '../../src/utils/guardDB.service';
describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  const mockStripe = {
    checkout: {
      sessions: {
        retrieve: jest.fn(),
      },
    },
    subscriptions: {
      retrieve: jest.fn(),
    },
  };
  const mockGuardDB = {
    getOrgSubscription: jest.fn(),
    setOrgSubscription: jest.fn(),
    clearOrgSubscription: jest.fn(),
  };
  const buildSession = (
    overrides: Partial<Stripe.Checkout.Session> = {},
  ): Stripe.Checkout.Session =>
    ({
      id: 'cs_test_1',
      mode: 'subscription',
      status: 'complete',
      client_reference_id: 'org-1',
      metadata: { orgId: 'org-1', plan: 'growth' },
      subscription: { id: 'sub_1', status: 'active' },
      ...overrides,
    }) as unknown as Stripe.Checkout.Session;
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: Stripe, useValue: mockStripe },
        { provide: GuardDBService, useValue: mockGuardDB },
      ],
    }).compile();

    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  it('should be defined', () => {
    expect(subscriptionService).toBeDefined();
  });
  describe('getSubscription', () => {
    it('should return guardDBService getOrgSubscription return value', async () => {
      mockGuardDB.getOrgSubscription.mockResolvedValueOnce('starter');
      const result = await subscriptionService.getSubscription('org-1');
      expect(mockGuardDB.getOrgSubscription).toHaveBeenCalledWith('org-1');
      expect(result).toEqual('starter');
    });
  });
  describe('confirmCheckoutSession', () => {
    it('should reject session ids without the cs_ prefix without calling Stripe', async () => {
      await expect(
        subscriptionService.confirmCheckoutSession('sub_1', 'org-1'),
      ).rejects.toThrow(new BadRequestException('Invalid checkout session'));
      expect(mockStripe.checkout.sessions.retrieve).not.toHaveBeenCalled();
    });
    it('should throw BadRequest if Stripe cannot retrieve the session', async () => {
      mockStripe.checkout.sessions.retrieve.mockRejectedValueOnce(
        new Error('No such checkout.session'),
      );
      await expect(
        subscriptionService.confirmCheckoutSession('cs_test_1', 'org-1'),
      ).rejects.toThrow(new BadRequestException('Invalid checkout session'));
    });
    it('should retrieve the session with the subscription expanded', async () => {
      mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce(
        buildSession(),
      );
      await subscriptionService.confirmCheckoutSession('cs_test_1', 'org-1');
      expect(mockStripe.checkout.sessions.retrieve).toHaveBeenCalledWith(
        'cs_test_1',
        { expand: ['subscription'] },
      );
    });
    it('should throw Forbidden if the session belongs to another organization', async () => {
      mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce(
        buildSession({ client_reference_id: 'org-2' }),
      );
      await expect(
        subscriptionService.confirmCheckoutSession('cs_test_1', 'org-1'),
      ).rejects.toThrow(
        new ForbiddenException(
          'Checkout session does not belong to your organization',
        ),
      );
      expect(mockGuardDB.setOrgSubscription).not.toHaveBeenCalled();
    });
    it('should activate the subscription for a matching session', async () => {
      mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce(
        buildSession(),
      );
      const result = await subscriptionService.confirmCheckoutSession(
        'cs_test_1',
        'org-1',
      );
      expect(result).toEqual(true);
      expect(mockGuardDB.setOrgSubscription).toHaveBeenCalledWith(
        'org-1',
        'growth',
        'sub_1',
      );
    });
  });
  describe('activateFromCheckoutSession', () => {
    it('should fall back to metadata orgId if client_reference_id is missing', async () => {
      const result = await subscriptionService.activateFromCheckoutSession(
        buildSession({ client_reference_id: null }),
      );
      expect(result).toEqual(true);
      expect(mockGuardDB.setOrgSubscription).toHaveBeenCalledWith(
        'org-1',
        'growth',
        'sub_1',
      );
    });
    it('should return false if no orgId is present', async () => {
      const result = await subscriptionService.activateFromCheckoutSession(
        buildSession({
          client_reference_id: null,
          metadata: { plan: 'growth' },
        }),
      );
      expect(result).toEqual(false);
      expect(mockGuardDB.setOrgSubscription).not.toHaveBeenCalled();
    });
    it('should return false if no plan is present', async () => {
      const result = await subscriptionService.activateFromCheckoutSession(
        buildSession({ metadata: { orgId: 'org-1' } }),
      );
      expect(result).toEqual(false);
      expect(mockGuardDB.setOrgSubscription).not.toHaveBeenCalled();
    });
    it('should return false for an unknown plan', async () => {
      const result = await subscriptionService.activateFromCheckoutSession(
        buildSession({ metadata: { orgId: 'org-1', plan: 'platinum' } }),
      );
      expect(result).toEqual(false);
      expect(mockGuardDB.setOrgSubscription).not.toHaveBeenCalled();
    });
    it('should return false if the session is not in subscription mode', async () => {
      const result = await subscriptionService.activateFromCheckoutSession(
        buildSession({ mode: 'payment' }),
      );
      expect(result).toEqual(false);
      expect(mockGuardDB.setOrgSubscription).not.toHaveBeenCalled();
    });
    it('should return false if the session is not complete', async () => {
      const result = await subscriptionService.activateFromCheckoutSession(
        buildSession({ status: 'open' }),
      );
      expect(result).toEqual(false);
      expect(mockGuardDB.setOrgSubscription).not.toHaveBeenCalled();
    });
    it('should return false if the session has no subscription', async () => {
      const result = await subscriptionService.activateFromCheckoutSession(
        buildSession({ subscription: null }),
      );
      expect(result).toEqual(false);
      expect(mockGuardDB.setOrgSubscription).not.toHaveBeenCalled();
    });
    it('should retrieve the subscription if it is not expanded', async () => {
      mockStripe.subscriptions.retrieve.mockResolvedValueOnce({
        id: 'sub_2',
        status: 'trialing',
      });
      const result = await subscriptionService.activateFromCheckoutSession(
        buildSession({ subscription: 'sub_2' }),
      );
      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_2');
      expect(result).toEqual(true);
      expect(mockGuardDB.setOrgSubscription).toHaveBeenCalledWith(
        'org-1',
        'growth',
        'sub_2',
      );
    });
    it('should not retrieve the subscription if it is already expanded', async () => {
      await subscriptionService.activateFromCheckoutSession(buildSession());
      expect(mockStripe.subscriptions.retrieve).not.toHaveBeenCalled();
    });
    it.each(['canceled', 'past_due', 'unpaid', 'incomplete'])(
      'should return false if the subscription status is %s',
      async (status) => {
        const result = await subscriptionService.activateFromCheckoutSession(
          buildSession({
            subscription: {
              id: 'sub_1',
              status,
            } as unknown as Stripe.Subscription,
          }),
        );
        expect(result).toEqual(false);
        expect(mockGuardDB.setOrgSubscription).not.toHaveBeenCalled();
      },
    );
  });
  describe('handleSubscriptionChange', () => {
    it.each(['canceled', 'unpaid', 'incomplete_expired'])(
      'should clear the subscription if the status is %s',
      async (status) => {
        await subscriptionService.handleSubscriptionChange({
          id: 'sub_1',
          status,
        } as unknown as Stripe.Subscription);
        expect(mockGuardDB.clearOrgSubscription).toHaveBeenCalledWith('sub_1');
      },
    );
    it.each(['active', 'trialing', 'past_due', 'incomplete', 'paused'])(
      'should not clear the subscription if the status is %s',
      async (status) => {
        await subscriptionService.handleSubscriptionChange({
          id: 'sub_1',
          status,
        } as unknown as Stripe.Subscription);
        expect(mockGuardDB.clearOrgSubscription).not.toHaveBeenCalled();
      },
    );
  });
});
