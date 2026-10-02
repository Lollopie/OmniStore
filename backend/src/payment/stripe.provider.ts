import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export const StripeProvider: Provider = {
  provide: Stripe,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) =>
    new Stripe(configService.getOrThrow<string>('payment.secretKey'), {
      apiVersion: '2026-08-26.dahlia',
    }),
};
