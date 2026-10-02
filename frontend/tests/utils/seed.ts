import { execSync } from 'node:child_process';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';

export type SubscriptionPlan = 'starter' | 'growth' | 'enterprise';

export interface SeededAccount {
  username: string;
  password: string;
  orgName: string;
  userId: string;
  orgId: string;
}

const BACKEND_DIR = path.resolve(import.meta.dirname, '../../../backend');

/**
 * Inserts an org owner directly into the database via the backend's seed script,
 * skipping registration emails and Stripe. The org has an active subscription
 * unless `subscription: null` is passed.
 */
export function seedAccount({ subscription = 'starter' }: { subscription?: SubscriptionPlan | null } = {}): SeededAccount {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const credentials = {
    username: `user_${suffix}`,
    password: 'password123',
    orgName: `org_${suffix}`,
  };
  const output = execSync('npm run --silent seed:playwright', {
    cwd: BACKEND_DIR,
    input: JSON.stringify({ ...credentials, subscription }),
    encoding: 'utf8',
    env: process.env,
  });
  // The script prints its result as the last line
  const { userId, orgId } = JSON.parse(output.trim().split('\n').pop()!) as { userId: string; orgId: string };
  return { ...credentials, userId, orgId };
}

/** Logs in through the API so the auth cookie is set in the page's context. */
export async function loginViaApi(page: Page, account: Pick<SeededAccount, 'username' | 'password'>) {
  const url = `${process.env.VITE_NESTJS_HOST_URL}/login`;
  const loginSuccess = await page.evaluate(async ({ url, username, password }) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    return res.ok;
  }, { url, username: account.username, password: account.password });
  expect(loginSuccess).toBeTruthy();
}
