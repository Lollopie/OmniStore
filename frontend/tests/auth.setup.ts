import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';
setup('register', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Username').fill('registeredAccount');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Register' }).click();
});
setup('authenticate', async ({ page }) => {
  const credentials = {
    username: `user_${Date.now()}`,
    password: 'password123',
  }
  await page.goto('/register');
  await page.getByLabel('Username').fill(credentials.username);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByText('Registration successful! You can now log in.')).toBeVisible();

  await page.goto('/login');
  await page.getByLabel('Username').fill(credentials.username);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL('/');

  await page.context().storageState({ path: authFile });
});