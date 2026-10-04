import { registerAs } from '@nestjs/config';

export default registerAs('payment', () => ({
  secretKey: process.env.STRIPE_SECRET_KEY,
  prices: {
    starter: process.env.STRIPE_PRICE_STARTER,
    growth: process.env.STRIPE_PRICE_GROWTH,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  } as Record<string, string | undefined>,
  webhookKey: process.env.STRIPE_WEBHOOK_SECRET,
  // Optional; Stripe falls back to the default portal configuration
  portalConfiguration: process.env.STRIPE_PORTAL_CONFIGURATION,
}));
