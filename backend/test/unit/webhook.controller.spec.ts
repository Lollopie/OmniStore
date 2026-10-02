import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Request, Response } from 'express';
import { WebhookController } from '../../src/payment/webhook.controller';
import { SubscriptionService } from '../../src/payment/subscription.service';
describe('WebhookController', () => {
  let webhookController: WebhookController;
  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('whsec_test'),
  };
  const mockStripe = {
    webhooks: {
      constructEvent: jest.fn(),
    },
  };
  const mockSubscriptionService = {
    activateFromCheckoutSession: jest.fn(),
    handleSubscriptionChange: jest.fn(),
  };
  const mockRequest = {
    headers: { 'stripe-signature': 'signature' },
  } as unknown as Request;
  const body = Buffer.from('{}');
  let mockResponse: { send: jest.Mock; sendStatus: jest.Mock };
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    mockResponse = { send: jest.fn(), sendStatus: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Stripe, useValue: mockStripe },
        { provide: SubscriptionService, useValue: mockSubscriptionService },
      ],
    }).compile();

    webhookController = module.get<WebhookController>(WebhookController);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  const handle = () =>
    webhookController.handleWebhookEvent(
      mockRequest,
      body,
      mockResponse as unknown as Response,
    );
  it('should be defined', () => {
    expect(webhookController).toBeDefined();
  });
  it('should verify the event with the raw body, signature and webhook secret', async () => {
    mockStripe.webhooks.constructEvent.mockReturnValueOnce({
      type: 'invoice.paid',
      data: { object: {} },
    });
    await handle();
    expect(mockConfigService.getOrThrow).toHaveBeenCalledWith(
      'payment.webhookKey',
    );
    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
      body,
      'signature',
      'whsec_test',
    );
  });
  it('should throw if no webhook secret is configured', async () => {
    mockConfigService.getOrThrow.mockImplementationOnce(() => {
      throw new TypeError(
        'Configuration key "payment.webhookKey" does not exist',
      );
    });
    await expect(handle()).rejects.toThrow(TypeError);
    expect(mockStripe.webhooks.constructEvent).not.toHaveBeenCalled();
  });
  it('should respond 400 if the signature is invalid', async () => {
    mockStripe.webhooks.constructEvent.mockImplementationOnce(() => {
      throw new Error('No signatures found matching the expected signature');
    });
    await handle();
    expect(mockResponse.sendStatus).toHaveBeenCalledWith(400);
    expect(mockResponse.send).not.toHaveBeenCalled();
    expect(
      mockSubscriptionService.activateFromCheckoutSession,
    ).not.toHaveBeenCalled();
    expect(
      mockSubscriptionService.handleSubscriptionChange,
    ).not.toHaveBeenCalled();
  });
  it('should activate the subscription on checkout.session.completed', async () => {
    const session = { id: 'cs_test_1' };
    mockStripe.webhooks.constructEvent.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: { object: session },
    });
    await handle();
    expect(
      mockSubscriptionService.activateFromCheckoutSession,
    ).toHaveBeenCalledWith(session);
    expect(mockResponse.send).toHaveBeenCalled();
  });
  it.each(['customer.subscription.deleted', 'customer.subscription.updated'])(
    'should handle the subscription change on %s',
    async (type) => {
      const subscription = { id: 'sub_1', status: 'canceled' };
      mockStripe.webhooks.constructEvent.mockReturnValueOnce({
        type,
        data: { object: subscription },
      });
      await handle();
      expect(
        mockSubscriptionService.handleSubscriptionChange,
      ).toHaveBeenCalledWith(subscription);
      expect(mockResponse.send).toHaveBeenCalled();
    },
  );
  it('should acknowledge unhandled event types without acting on them', async () => {
    mockStripe.webhooks.constructEvent.mockReturnValueOnce({
      type: 'invoice.paid',
      data: { object: {} },
    });
    await handle();
    expect(
      mockSubscriptionService.activateFromCheckoutSession,
    ).not.toHaveBeenCalled();
    expect(
      mockSubscriptionService.handleSubscriptionChange,
    ).not.toHaveBeenCalled();
    expect(mockResponse.send).toHaveBeenCalled();
  });
});
