import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { SubscriptionService } from './subscription.service';
import { StripeProvider } from './stripe.provider';
import { GuardDBService } from '../utils/guardDB.service';

@Module({
  providers: [StripeProvider, SubscriptionService, GuardDBService],
  controllers: [PaymentController, WebhookController],
  exports: [SubscriptionService],
})
export class PaymentModule {}
