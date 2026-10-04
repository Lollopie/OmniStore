import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { GuardDBService } from '../utils/guardDB.service';
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
} from '../organization/organization.entity';

// Statuses in which the subscription grants access
const ACTIVE_SUBSCRIPTION_STATUSES: Stripe.Subscription.Status[] = [
  'active',
  'trialing',
];
// Statuses after which Stripe will no longer bill the subscription
const ENDED_SUBSCRIPTION_STATUSES: Stripe.Subscription.Status[] = [
  'canceled',
  'unpaid',
  'incomplete_expired',
];

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly stripe: Stripe,
    private readonly guardDBService: GuardDBService,
    private readonly configService: ConfigService,
  ) {}

  async getSubscription(orgId: string): Promise<SubscriptionPlan | null> {
    return await this.guardDBService.getOrgSubscription(orgId);
  }

  /**
   * Confirms a checkout session on behalf of the logged-in user, so access is
   * granted without waiting for the webhook.
   */
  async confirmCheckoutSession(
    sessionId: string,
    orgId: string,
  ): Promise<boolean> {
    if (!sessionId.startsWith('cs_')) {
      throw new BadRequestException('Invalid checkout session');
    }
    let session: Stripe.Checkout.Session;
    try {
      session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      });
    } catch {
      throw new BadRequestException('Invalid checkout session');
    }
    // Otherwise a user could submit another org's session ID
    if (this.getSessionOrgId(session) !== orgId) {
      throw new ForbiddenException(
        'Checkout session does not belong to your organization',
      );
    }
    return await this.activateFromCheckoutSession(session);
  }

  /**
   * Idempotently activates the plan bought in the given checkout session.
   * Returns false if the session hasn't resulted in an active subscription.
   */
  async activateFromCheckoutSession(
    session: Stripe.Checkout.Session,
  ): Promise<boolean> {
    const orgId = this.getSessionOrgId(session);
    const plan = session.metadata?.plan as SubscriptionPlan | undefined;
    if (!orgId || !plan || !SUBSCRIPTION_PLANS.includes(plan)) {
      console.log(
        `Checkout session ${session.id} is missing a valid orgId/plan.`,
      );
      return false;
    }
    if (session.mode !== 'subscription' || session.status !== 'complete') {
      return false;
    }
    const subscription = await this.resolveSubscription(session);
    // A paid session isn't enough: the subscription may have ended since
    if (
      !subscription ||
      !ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)
    ) {
      return false;
    }
    await this.guardDBService.setOrgSubscription(orgId, plan, subscription.id);
    return true;
  }

  async handleSubscriptionChange(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    if (ENDED_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
      await this.guardDBService.clearOrgSubscription(subscription.id);
      return;
    }
    // Plan switches in the Customer Portal change the subscription's price
    if (ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
      const plan = this.getPlanForPrice(subscription.items?.data[0]?.price.id);
      if (plan) {
        await this.guardDBService.updateOrgSubscriptionPlan(
          subscription.id,
          plan,
        );
      }
    }
  }

  async getBillingDetails(stripeSubscriptionId: string) {
    const subscription =
      await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
    const periodEnd = subscription.items.data[0]?.current_period_end ?? null;
    const cancelAt =
      subscription.cancel_at ??
      (subscription.cancel_at_period_end ? periodEnd : null);
    return {
      status: subscription.status,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAt: cancelAt ? new Date(cancelAt * 1000) : null,
    };
  }

  async createPortalSession(
    stripeSubscriptionId: string,
    returnUrl: string,
  ): Promise<string> {
    const subscription =
      await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
    const customer =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;
    const configuration = this.configService.get<string>(
      'payment.portalConfiguration',
    );
    const session = await this.stripe.billingPortal.sessions.create({
      customer,
      return_url: returnUrl,
      ...(configuration ? { configuration } : {}),
    });
    return session.url;
  }

  private getPlanForPrice(priceId?: string): SubscriptionPlan | null {
    if (!priceId) {
      return null;
    }
    const prices =
      this.configService.get<Record<string, string | undefined>>(
        'payment.prices',
      ) ?? {};
    const plan = SUBSCRIPTION_PLANS.find((p) => prices[p] === priceId);
    return plan ?? null;
  }

  /** Cancels the subscription immediately unless it has already ended. */
  async cancelSubscription(stripeSubscriptionId: string): Promise<void> {
    const subscription =
      await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
    if (!ENDED_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
      await this.stripe.subscriptions.cancel(stripeSubscriptionId);
    }
  }

  private getSessionOrgId(session: Stripe.Checkout.Session): string | null {
    return session.client_reference_id ?? session.metadata?.orgId ?? null;
  }

  private async resolveSubscription(
    session: Stripe.Checkout.Session,
  ): Promise<Stripe.Subscription | null> {
    if (!session.subscription) {
      return null;
    }
    if (typeof session.subscription !== 'string') {
      return session.subscription;
    }
    return await this.stripe.subscriptions.retrieve(session.subscription);
  }
}
