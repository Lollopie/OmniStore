import { Controller, Post, RawBody, Req, Res } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { SubscriptionService } from './subscription.service';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly configService: ConfigService,
    private readonly stripe: Stripe,
    private readonly subscriptionService: SubscriptionService,
  ) {}
  @Post()
  async handleWebhookEvent(
    @Req() req: Request,
    @RawBody() body: Buffer,
    @Res() response: Response,
  ) {
    // Never accept unsigned events: checkout.session.completed unlocks a paid plan
    const webhookSecret =
      this.configService.getOrThrow<string>('payment.webhookKey');
    const signature = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret,
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
      }
      return response.sendStatus(400);
    }
    switch (event.type) {
      case 'checkout.session.completed':
        await this.subscriptionService.activateFromCheckoutSession(
          event.data.object,
        );
        break;
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated':
        await this.subscriptionService.handleSubscriptionChange(
          event.data.object,
        );
        break;
      default:
        console.log(`Unhandled event type ${event.type}.`);
    }

    response.send();
  }
}
