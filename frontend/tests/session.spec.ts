import { expect, test } from '@playwright/test';
import { seedAccount } from './utils/seed';

test.describe('Session refresh', () => {
  test('renews an expired access token without logging the user out', async ({ page, context }) => {
    const account = seedAccount();
    await page.goto('/login');
    await page.getByLabel('Username').fill(account.username);
    await page.getByRole('textbox', { name: 'Password' }).fill(account.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/organizations');

    // Without the access token only the refresh token is left, as after 15 minutes
    await context.clearCookies({ name: 'token' });
    const refreshResponse = page.waitForResponse(
      (res) => res.url().endsWith('/auth/refresh') && res.request().method() === 'POST',
    );
    await page.reload();

    expect((await refreshResponse).status()).toBe(200);
    await expect(page).toHaveURL('/organizations');
    await expect(page.getByRole('row').filter({ hasText: account.username })).toBeVisible();
    expect((await context.cookies()).some((cookie) => cookie.name === 'token')).toBe(true);
  });

  test('sends the user to the login page once the session cannot be renewed', async ({ page, context }) => {
    const account = seedAccount();
    await page.goto('/login');
    await page.getByLabel('Username').fill(account.username);
    await page.getByRole('textbox', { name: 'Password' }).fill(account.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/organizations');

    await context.clearCookies();
    await page.goto('/inventory');

    await expect(page).toHaveURL('/login');
  });
});
