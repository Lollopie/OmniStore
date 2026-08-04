import { expect, test } from '@playwright/test';

test.describe('Delete Account', () => {
  let username: string;
  let password: string;

  test.beforeAll(async () => {
    username = `user_${Date.now()}`;
    password = 'password123';
  });

  test('user can delete their account', async ({ page }) => {
    // Register
    await page.goto('/register');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    const registerResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/register') && res.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Register' }).click();

    await registerResponsePromise;
    await expect(page.getByText('Registration successful! You can now log in.')).toBeVisible();

    // Login
    await page.goto('/login');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    const loginResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/login') && res.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Login' }).click();
    await loginResponsePromise;
    await expect(page).toHaveURL('/');

    await page.goto('/settings/account');

    await page.getByRole('button', { name: 'Delete' }).filter({ hasText: 'Delete Account' }).click();

    await page.getByPlaceholder('Enter your password').fill(password);
    const deleteResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/users') && res.request().method() === 'DELETE'
    );
    await page.getByRole('button', { name: 'Delete' }).filter({ hasText: 'Confirm Deletion' }).click();
    await deleteResponsePromise;
    await expect(page.getByText('Account successfully deleted.')).toBeVisible();
  });

  test('user cannot delete account with incorrect password', async ({ page }) => {
    // Register
    await page.goto('/register');
    await page.getByLabel('Username').fill(`${username}_wrong`);
    await page.getByLabel('Password').fill(password);
    const registerResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/register') && res.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Register' }).click();
    await registerResponsePromise;
    await expect(page.getByText('Registration successful! You can now log in.')).toBeVisible();

    // Login
    await page.goto('/login');
    await page.getByLabel('Username').fill(`${username}_wrong`);
    await page.getByLabel('Password').fill(password);
    const loginResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/login') && res.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Login' }).click();
    await loginResponsePromise;
    await expect(page).toHaveURL('/');

    // Navigate to Account Settings
    await page.goto('/settings/account');

    // Click Delete Account
    await page.getByRole('button', { name: 'Delete' }).filter({ hasText: 'Delete Account' }).click();

    // Enter wrong password
    await page.getByPlaceholder('Enter your password').fill('wrong_password');

    // Confirm
    await page.getByRole('button', { name: 'Delete' }).filter({ hasText: 'Confirm Deletion' }).click();

    // Verify error
    await expect(page.getByText('Invalid password')).toBeVisible();
  });
});