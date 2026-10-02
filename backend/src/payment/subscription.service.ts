import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import Stripe from 'stripe';
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
