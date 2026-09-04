import { expect, Page, test } from '@playwright/test';
import { getLatestEmailFor } from './utils/mail';
async function createAccount(page: Page, credentials: { email: string; username: string; password: string; orgName: string }) {
  await page.goto('/register');
  await page.getByLabel('Email').fill(credentials.email);
  const registerResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/register') && res.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'Register' }).click();

  await registerResponsePromise;
  await expect(page.getByText('Registration successful! Please check your email for further instructions.')).toBeVisible();

  const message = await getLatestEmailFor(page, credentials.email);
  const match = message.HTML.match(/token=([0-9a-zA-Z]*)"/);
  const verificationToken = match?.[1];
  expect(verificationToken).toBeTruthy();

  await page.goto('/register/verify?token=' + verificationToken);
  await page.getByLabel('Username').fill(credentials.username);
  await page.getByRole('textbox', { name: 'Password' }).fill(credentials.password);
  await page.getByLabel('Organization Name').fill(credentials.orgName);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText('Organization created successfully.')).toBeVisible();

  await page.goto('/login');
  await page.getByLabel('Username').fill(credentials.username);
  await page.getByRole('textbox', { name: 'Password' }).fill(credentials.password);
  const loginResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/login') && res.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'Login' }).click();
  await loginResponsePromise;
  await expect(page).toHaveURL('/organizations');
}
test.describe('Delete Account', () => {
  let credentials: { email: string; username: string; password: string; orgName: string };

  test.beforeEach(async () => {
    credentials = {
      email: `user_${Date.now()}@example.com`,
      username: `user_${Date.now()}`,
      password: 'password123',
      orgName: 'user_org_' + Date.now(),
    };
  });

  test('user can delete their account', async ({ page }) => {
    await createAccount(page, credentials);

    await page.goto('/settings/account');

    await page.getByRole('button', { name: 'Delete' }).filter({ hasText: 'Delete Account' }).click();

    await page.getByPlaceholder('Enter your password').fill(credentials.password);
    const deleteResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/users') && res.request().method() === 'DELETE'
    );
    await page.getByRole('button', { name: 'Delete' }).filter({ hasText: 'Confirm Deletion' }).click();
    await deleteResponsePromise;
    await expect(page.getByText('Account successfully deleted.')).toBeVisible();
  });

  test('user cannot delete account with incorrect password', async ({ page }) => {
    await createAccount(page, credentials);

    await page.goto('/settings/account');

    await page.getByRole('button', { name: 'Delete' }).filter({ hasText: 'Delete Account' }).click();

    await page.getByPlaceholder('Enter your password').fill('wrong_password');

    await page.getByRole('button', { name: 'Delete' }).filter({ hasText: 'Confirm Deletion' }).click();

    await expect(page.getByText('Invalid password')).toBeVisible();
  });
});