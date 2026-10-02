/**
 * Seeds an organization owner for the Playwright tests, bypassing the
 * registration emails and Stripe checkout.
 *
 * Reads a JSON object from stdin:
 *   { username, password, orgName, subscription? }
 * `subscription` defaults to 'starter'; pass null for an unsubscribed org.
 * Prints { userId, orgId } as JSON to stdout.
 */
import './loadEnv';
import { SeedingDataSource } from '../databaseSeeds/typeorm.config';
import { seedOrganization, seedOrgRole, seedUser } from '../databaseSeeds/seed';
import { SubscriptionPlan } from '../../src/organization/organization.entity';
import { OrganizationRole } from '@shared/enum/organizationRoles.enum';

interface SeedAccountInput {
  username: string;
  password: string;
  orgName: string;
  subscription?: SubscriptionPlan | null;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const input = JSON.parse(await readStdin()) as SeedAccountInput;
  if (!input.username || !input.password || !input.orgName) {
    throw new Error('username, password and orgName are required');
  }
  await SeedingDataSource.initialize();
  try {
    const user = await seedUser(
      SeedingDataSource,
      input.username,
      input.password,
    );
    const org = await seedOrganization(
      SeedingDataSource,
      input.orgName,
      input.subscription === undefined ? 'starter' : input.subscription,
    );
    await seedOrgRole(SeedingDataSource, user, org, OrganizationRole.OWNER);
    console.log(JSON.stringify({ userId: user.userId, orgId: org.orgId }));
  } finally {
    await SeedingDataSource.destroy();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
