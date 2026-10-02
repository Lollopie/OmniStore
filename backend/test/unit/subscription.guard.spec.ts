import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionGuard } from '../../src/payment/subscription.guard';
import { GuardDBService } from '../../src/utils/guardDB.service';
describe('SubscriptionGuard', () => {
  let subscriptionGuard: SubscriptionGuard;
  const mockGuardDB = {
    getOrgSubscription: jest.fn(),
  };
  const buildContext = (request: object): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as unknown as ExecutionContext;
  const forbidden = new ForbiddenException(
    'An active subscription is required to perform this action',
  );
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionGuard,
        { provide: GuardDBService, useValue: mockGuardDB },
      ],
    }).compile();

    subscriptionGuard = module.get<SubscriptionGuard>(SubscriptionGuard);
  });
  it('should be defined', () => {
    expect(subscriptionGuard).toBeDefined();
  });
  it('should throw if no user in request', async () => {
    await expect(
      subscriptionGuard.canActivate(buildContext({})),
    ).rejects.toThrow(forbidden);
    expect(mockGuardDB.getOrgSubscription).not.toHaveBeenCalled();
  });
  it('should throw if no orgId is set', async () => {
    await expect(
      subscriptionGuard.canActivate(buildContext({ user: { orgId: '' } })),
    ).rejects.toThrow(forbidden);
    expect(mockGuardDB.getOrgSubscription).not.toHaveBeenCalled();
  });
  it('should throw if the organization has no subscription', async () => {
    mockGuardDB.getOrgSubscription.mockResolvedValueOnce(null);
    await expect(
      subscriptionGuard.canActivate(buildContext({ user: { orgId: 'org-1' } })),
    ).rejects.toThrow(forbidden);
    expect(mockGuardDB.getOrgSubscription).toHaveBeenCalledWith('org-1');
  });
  it('should allow if the organization has a subscription', async () => {
    mockGuardDB.getOrgSubscription.mockResolvedValueOnce('starter');
    const result = await subscriptionGuard.canActivate(
      buildContext({ user: { orgId: 'org-1' } }),
    );
    expect(result).toEqual(true);
  });
});
