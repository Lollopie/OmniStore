import { expect, Page } from '@playwright/test';
import { getLatestEmailFor } from './mail';

export async function registerUser(page: Page) {
  const credentials = {
    email: `warehouse_user_${Date.now()}@example.com`,
    username:  `warehouse_user_${Date.now()}`,
    password:  'password123',
  }
  await page.getByRole('link', { name: 'Invites' }).click();
  await expect(page.getByRole('heading', { name: 'Warehouse Invites' })).toBeVisible();
  await page.getByPlaceholder('Enter user email').fill(credentials.email);
  console.log(await page.localStorage.getItem('activeRole'));
  await page.getByText('Invite', { exact: true }).click();
  const message = await getLatestEmailFor(page, credentials.email);
  const match = message.HTML.match(/token=([0-9a-zA-Z]*)"/);
  const verificationToken = match?.[1];
  expect(verificationToken).toBeTruthy();
  const creationResponse = await page.request.post(`${process.env.VITE_NESTJS_HOST_URL}/invites/accept?token=${verificationToken}`, {
    data: {
      username: credentials.username,
      password: credentials.password,
    }
  });
  expect(creationResponse.status()).toBe(201);
  return credentials.username;
}