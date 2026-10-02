import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, CanActivate } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentController } from '../../src/payment/payment.controller';
import { AuthGuard } from '../../src/auth/auth.guard';
import { Cookie } from '../../src/user/user.decorator';
import { SubscriptionPlan } from '../../src/organization/organization.entity';
describe('PaymentController', () => {
  let paymentController: PaymentController;
  class MockGuard implements CanActivate {
    canActivate(): boolean {
      return true;
    }
  }
  const config: Record<string, unknown> = {
    'payment.prices': {
      starter: 'price_starter',
      growth: 'price_growth',
      enterprise: undefined,
    },
    'app.frontendUrl': 'http://frontend',
  };
  const mockConfigService = {
    get: jest.fn((key: string) => config[key]),
  };
  const mockStripe = {
    checkout: {
      sessions: {
        create: jest
          .fn()
          .mockResolvedValue({ id: 'cs_test_1', url: 'https://stripe/cs' }),
      },
    },
  };
  const userToken: Cookie = {
    username: 'username',
    userId: 'user-1',
    orgId: 'org-1',
    activeWarehouseId: '',
    activeRole: '',
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Stripe, useValue: mockStripe },
      ],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockGuard)
      .compile();

    paymentController = module.get<PaymentController>(PaymentController);
  });
  it('should be defined', () => {
    expect(paymentController).toBeDefined();
  });
  describe('createPaymentSession', () => {
    it('should create a subscription checkout session for the configured price', async () => {
      await paymentController.createPaymentSession(userToken, {
        plan: 'growth',
      });
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          line_items: [{ price: 'price_growth', quantity: 1 }],
          success_url:
            'http://frontend/checkout/success?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: 'http://frontend/subscribe',
          client_reference_id: 'org-1',
          metadata: { orgId: 'org-1', plan: 'growth' },
        }),
      );
    });
    it('should return the session url and id', async () => {
      const response = await paymentController.createPaymentSession(userToken, {
        plan: 'starter',
      });
      expect(response).toEqual({
        url: 'https://stripe/cs',
        sessionId: 'cs_test_1',
      });
    });
    it('should throw for a plan that is not configured', async () => {
      await expect(
        paymentController.createPaymentSession(userToken, {
          plan: 'platinum' as SubscriptionPlan,
        }),
      ).rejects.toThrow(new BadRequestException('Unknown subscription plan'));
      expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
    });
    it('should throw for a plan without a price id', async () => {
      await expect(
        paymentController.createPaymentSession(userToken, {
          plan: 'enterprise',
        }),
      ).rejects.toThrow(new BadRequestException('Unknown subscription plan'));
      expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
    });
    it('should not resolve inherited object properties as plans', async () => {
      await expect(
        paymentController.createPaymentSession(userToken, {
          plan: 'toString' as SubscriptionPlan,
        }),
      ).rejects.toThrow(new BadRequestException('Unknown subscription plan'));
      expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
    });
    it('should throw if no prices are configured', async () => {
      mockConfigService.get.mockReturnValueOnce(undefined);
      await expect(
        paymentController.createPaymentSession(userToken, { plan: 'starter' }),
      ).rejects.toThrow(new BadRequestException('Unknown subscription plan'));
    });
  });
});
