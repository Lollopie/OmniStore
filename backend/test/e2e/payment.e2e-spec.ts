import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CanActivate, Injectable, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import authConfig from '../../src/config/auth.config';
import dbConfig from '../../src/config/db.config';
import { ThrottlerGuard } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import { JwtModule } from '@nestjs/jwt';
import appConfig from '../../src/config/app.config';
import emailConfig from '../../src/config/email.config';
import { ScenarioBuilder } from './utils/scenarioBuilder';
import { DataSource } from 'typeorm';
import { SeedingDataSource } from '../databaseSeeds/typeorm.config';
import { login } from './utils/helper';
import request from 'supertest';
import Stripe from 'stripe';
@Injectable()
class MockThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
const WEBHOOK_SECRET = 'whsec_e2e_test';
describe('Payment (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  const stripe = new Stripe('sk_test_placeholder');
  // Signs the payload like Stripe does, so no Stripe API call is needed
  const sendWebhook = (event: object, secret = WEBHOOK_SECRET) => {
    const payload = JSON.stringify(event);
    return request(app.getHttpServer())
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set(
        'stripe-signature',
        stripe.webhooks.generateTestHeaderString({ payload, secret }),
      )
      .send(payload);
  };
  const checkoutCompletedEvent = (orgId: string, subscriptionId: string) => ({
    id: 'evt_checkout',
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_e2e',
        object: 'checkout.session',
        mode: 'subscription',
        status: 'complete',
        client_reference_id: orgId,
        metadata: { orgId, plan: 'growth' },
        // Expanded, so the service doesn't have to retrieve it from Stripe
        subscription: { id: subscriptionId, status: 'active' },
      },
    },
  });
  const getSubscription = async (orgId: string) => {
    const [row]: { subscription: string | null }[] = await dataSource.query(
      `SELECT subscription FROM organization WHERE org_id = $1`,
      [orgId],
    );
    return row.subscription;
  };
  beforeAll(async () => {
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.${process.env.NODE_ENV || 'test'}`, `.env`],
          load: [appConfig, authConfig, dbConfig, emailConfig],
        }),
        AppModule,
        JwtModule.registerAsync({
          global: true,
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('auth.jwtSecret'),
            signOptions: {
              expiresIn: configService.get<number>('auth.jwtExpiresIn'),
            },
          }),
        }),
      ],
      providers: [],
    })
      .overrideProvider(ThrottlerGuard)
      .useClass(MockThrottlerGuard)
      .compile();

    // The webhook signature is computed over the raw request body
    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());
    await app.init();
    dataSource = await SeedingDataSource.initialize();
  });
  describe('subscription', () => {
    it('should return the organization subscription', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1', 'growth')
        .then((b) => b.withUser('user1', 'owner'));
      const user = scenarioBuilder['users']['user1'];
      const agent = await login(app, user.username, 'password1');

      const response = await agent
        .get('/organizations/subscription')
        .expect(200);
      expect(response.body).toEqual({ subscription: 'growth' });
    });
    it('should return null for an organization without subscription', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1', null)
        .then((b) => b.withUser('user1', 'owner'));
      const user = scenarioBuilder['users']['user1'];
      const agent = await login(app, user.username, 'password1');

      const response = await agent
        .get('/organizations/subscription')
        .expect(200);
      expect(response.body).toEqual({ subscription: null });
    });
    it('should reject an invalid checkout session id', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1', null)
        .then((b) => b.withUser('user1', 'owner'));
      const user = scenarioBuilder['users']['user1'];
      const agent = await login(app, user.username, 'password1');

      const response = await agent
        .get('/organizations/subscription?sessionId=invalid')
        .expect(400);
      expect(response.body.message).toEqual('Invalid checkout session');
    });
    it('should block write requests for organizations without subscription', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1', null)
        .then((b) => b.withUser('user1', 'owner'));
      const user = scenarioBuilder['users']['user1'];
      const agent = await login(app, user.username, 'password1');

      const response = await agent
        .post('/warehouses')
        .send({ warehouseName: 'Warehouse 1' })
        .expect(403);
      expect(response.body.message).toEqual(
        'An active subscription is required to perform this action',
      );
    });
    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/organizations/subscription')
        .expect(401);
      expect(response.body.message).toEqual('No token provided');
    });
  });
  describe('checkout', () => {
    it('should reject an unknown plan', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1', null)
        .then((b) => b.withUser('user1', 'owner'));
      const user = scenarioBuilder['users']['user1'];
      const agent = await login(app, user.username, 'password1');

      const response = await agent
        .post('/checkout/create-session')
        .send({ plan: 'platinum' })
        .expect(400);
      expect(response.body.message).toEqual('Unknown subscription plan');
    });
    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/checkout/create-session')
        .send({ plan: 'starter' })
        .expect(401);
      expect(response.body.message).toEqual('No token provided');
    });
  });
  describe('webhook', () => {
    it('should reject events without signature', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(
        dataSource,
      ).withOrganization('Org1', null);
      const orgId = scenarioBuilder['org'].orgId;

      await request(app.getHttpServer())
        .post('/webhook')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(checkoutCompletedEvent(orgId, 'sub_e2e')))
        .expect(400);
      expect(await getSubscription(orgId)).toBeNull();
    });
    it('should reject events signed with another secret', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(
        dataSource,
      ).withOrganization('Org1', null);
      const orgId = scenarioBuilder['org'].orgId;

      await sendWebhook(
        checkoutCompletedEvent(orgId, 'sub_e2e'),
        'whsec_wrong',
      ).expect(400);
      expect(await getSubscription(orgId)).toBeNull();
    });
    it('should activate the subscription on checkout.session.completed', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1', null)
        .then((b) => b.withUser('user1', 'owner'));
      const orgId = scenarioBuilder['org'].orgId;

      await sendWebhook(checkoutCompletedEvent(orgId, 'sub_e2e')).expect(201);
      expect(await getSubscription(orgId)).toEqual('growth');

      const user = scenarioBuilder['users']['user1'];
      const agent = await login(app, user.username, 'password1');
      await agent
        .post('/warehouses')
        .send({ warehouseName: 'Warehouse 1' })
        .expect(201);
    });
    it('should clear the subscription on customer.subscription.deleted', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(
        dataSource,
      ).withOrganization('Org1', null);
      const orgId = scenarioBuilder['org'].orgId;
      await sendWebhook(checkoutCompletedEvent(orgId, 'sub_e2e')).expect(201);

      await sendWebhook({
        id: 'evt_deleted',
        object: 'event',
        type: 'customer.subscription.deleted',
        data: {
          object: { id: 'sub_e2e', object: 'subscription', status: 'canceled' },
        },
      }).expect(201);
      expect(await getSubscription(orgId)).toBeNull();
    });
    it('should keep the subscription on customer.subscription.updated while active', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(
        dataSource,
      ).withOrganization('Org1', null);
      const orgId = scenarioBuilder['org'].orgId;
      await sendWebhook(checkoutCompletedEvent(orgId, 'sub_e2e')).expect(201);

      await sendWebhook({
        id: 'evt_updated',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: { id: 'sub_e2e', object: 'subscription', status: 'past_due' },
        },
      }).expect(201);
      expect(await getSubscription(orgId)).toEqual('growth');
    });
  });
  afterEach(async () => {
    const entities = dataSource.entityMetadatas;
    const tableNames = entities
      .map((entity) => `"${entity.tableName}"`)
      .join(', ');

    if (tableNames.length > 0) {
      // TRUNCATE empties the tables, RESTART IDENTITY resets IDs to 1, CASCADE handles foreign keys
      await dataSource.query(
        `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`,
      );
    }
  });
  afterAll(async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    await dataSource.destroy();
    await app.close();
  });
});
