import { expect, test, type Page, type Route } from '@playwright/test';
import { getLatestEmailFor } from './utils/mail';

async function routeApi(
  page: Page,
  path: string,
  handler: (route: Route) => Promise<void> | void,
  method: string = 'POST'
) {
  await page.route(`**${path}`, async (route) => {
    if (route.request().method() === method) {
      await handler(route);
      const postData = route.request().postData();
      await route.continue(postData ? { postData } : {});
    } else {
      await route.continue();
    }
  });
}
let credentials: { email: string; username: string; password: string; orgName: string };

test.beforeAll(async () => {
  credentials = {
    email: `user_${Date.now()}@example.com`,
    username: `user_${Date.now()}`,
    password: 'password123',
    orgName: 'user_org',
  };
});
test.describe.configure({ mode: 'serial' });
test('guest can register a new account', async ({ page }) => {
  let capturedPayload: { email: string } | undefined;
  await routeApi(page, '/register', async (route) => {
    capturedPayload = route.request().postDataJSON();

    expect(capturedPayload).toEqual({
      email: credentials.email,
    });
  }, 'POST');

  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
  await page.getByLabel('Email').fill(credentials.email);

  const registerResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/register') && res.request().method() === 'POST'
  );

  await page.getByRole('button', { name: 'Register' }).click();
  await registerResponsePromise;

  await expect(page.getByText('Registration successful! Please check your email for further instructions.')).toBeVisible();

  expect(capturedPayload).toEqual({
    email: credentials.email,
  });
});
test('guest can create organization with payload monitoring', async ({ page }) => {
  let capturedPayload: { ownerEmail?: string; ownerUsername?: string; ownerPassword?: string; name?: string } | undefined;
  const message = await getLatestEmailFor(page, credentials.email);
  const match = message.HTML.match(/token=([0-9a-zA-Z]*)"/);
  const verificationToken = match?.[1];
  expect(verificationToken).toBeTruthy();
  await routeApi(page, '/organizations/register?token=' + verificationToken, async (route) => {
    capturedPayload = route.request().postDataJSON();
    expect(capturedPayload).toEqual({
      ownerEmail: credentials.email,
      ownerUsername: credentials.username,
      ownerPassword: credentials.password,
      name: credentials.orgName,
    });
  }, 'POST');


  const creationResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/organizations/register?token=' + verificationToken) && res.request().method() === 'POST'
  );

  await page.goto('/register/verify?token=' + verificationToken);
  await page.getByLabel('Username').fill(credentials.username);
  await page.getByRole('textbox', { name: 'Password' }).fill(credentials.password);
  await page.getByLabel('Organization Name').fill(credentials.orgName);
  await page.getByRole('button', { name: 'Create' }).click();
  const response = await creationResponsePromise;
  expect(response.status()).toBe(201);

  expect(capturedPayload).toEqual({
    ownerEmail: credentials.email,
    ownerUsername: credentials.username,
    ownerPassword: credentials.password,
    name: credentials.orgName,
  });
  await expect(page.getByText('Organization created successfully.')).toBeVisible();
});
test('guest can sign in with payload monitoring', async ({ page }) => {
  let capturedPayload: { username?: string; password?: string } | undefined;
  await routeApi(page, '/login', async (route) => {
    capturedPayload = route.request().postDataJSON();

    expect(capturedPayload).toEqual({
      username: credentials.username,
      password: credentials.password,
    });
  }, 'POST');

  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  await page.getByLabel('Username').fill(credentials.username);
  await page.getByRole('textbox', { name: 'Password' }).fill(credentials.password);

  const loginResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/login') && res.request().method() === 'POST'
  );

  await page.getByRole('button', { name: 'Login' }).click();

  const response = await loginResponsePromise;
  expect(response.status()).toBe(200);

  expect(capturedPayload).toEqual({ username: credentials.username, password: credentials.password });

  await expect(page).toHaveURL('/organizations');
});

test('guest is redirected from protected pages', async ({ page }) => {
  await page.goto('/inventory');
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});