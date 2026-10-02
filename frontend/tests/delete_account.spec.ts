import { expect, Page, test } from '@playwright/test';
import { seedAccount, type SeededAccount } from './utils/seed';

// Registration itself is covered in login.spec.ts, so seed the account and just log in
async function createAccount(page: Page): Promise<SeededAccount> {
  const account = seedAccount();
  await page.goto('/login');
  await page.getByLabel('Username').fill(account.username);
  await page.getByRole('textbox', { name: 'Password' }).fill(account.password);
  const loginResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/login') && res.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'Login' }).click();
  await loginResponsePromise;
  await expect(page).toHaveURL('/organizations');
  return account;
}
test.describe('Delete Account', () => {
  test('user can delete their account', async ({ page }) => {
    const credentials = await createAccount(page);

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
    await createAccount(page);

    await page.goto('/settings/account');

    await page.getByRole('button', { name: 'Delete' }).filter({ hasText: 'Delete Account' }).click();

    await page.getByPlaceholder('Enter your password').fill('wrong_password');

    await page.getByRole('button', { name: 'Delete' }).filter({ hasText: 'Confirm Deletion' }).click();

    await expect(page.getByText('Invalid password')).toBeVisible();
  });
});