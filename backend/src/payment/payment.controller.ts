import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import * as userDecorator from '../user/user.decorator';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { SubscriptionPlan } from '../organization/organization.entity';
import { GuardDBService } from '../utils/guardDB.service';
@Controller('checkout')
export class PaymentController {
  constructor(
    private readonly configService: ConfigService,
    private readonly stripe: Stripe,
    private readonly guardDBService: GuardDBService,
  ) {}
  @UseGuards(AuthGuard)
  @Post('create-session')
  async createPaymentSession(
    @userDecorator.User() userToken: userDecorator.Cookie,
    @Body() body: { plan: SubscriptionPlan },
  ) {
    const prices =
      this.configService.get<Record<string, string | undefined>>(
        'payment.prices',
      ) ?? {};
    const priceId = Object.hasOwn(prices, body.plan)
      ? prices[body.plan]
      : undefined;
    if (!priceId) {
      throw new BadRequestException('Unknown subscription plan');
    }
    // A second checkout would start a second, separately billed subscription
    if (await this.guardDBService.getOrgSubscription(userToken.orgId)) {
      throw new BadRequestException(
        'Your organization already has a subscription. Change it in the billing settings.',
      );
    }
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const session = await this.stripe.checkout.sessions.create({
      ui_mode: 'hosted_page',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      // Stripe substitutes the literal {CHECKOUT_SESSION_ID} placeholder
      success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/subscribe`,
      integration_identifier: userToken.orgId,
      client_reference_id: userToken.orgId,
      metadata: { orgId: userToken.orgId, plan: body.plan },
      subscription_data: {
        metadata: { orgId: userToken.orgId, plan: body.plan },
      },
    });
    return { url: session.url, sessionId: session.id };
  }
}
