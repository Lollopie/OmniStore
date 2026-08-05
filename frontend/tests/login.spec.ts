import { expect, test, type Page, type Route } from '@playwright/test';

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
let credentials: { username: string; password: string };

test.beforeAll(async () => {
  credentials = {
    username: `user_${Date.now()}`,
    password: 'password123',
  };
});
test.describe.configure({ mode: 'serial' });
test('guest can register a new account', async ({ page }) => {
  let capturedPayload: { username: string; password: string } | undefined;
  await routeApi(page, '/register', async (route) => {
    capturedPayload = route.request().postDataJSON();

    expect(capturedPayload).toEqual({
      username: credentials.username,
      password: credentials.password,
    });
  }, 'POST');

  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Create an Account' })).toBeVisible();
  await page.getByLabel('Username').fill(credentials.username);
  await page.getByRole('textbox', { name: 'Password' }).fill(credentials.password);

  const registerResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/register') && res.request().method() === 'POST'
  );

  await page.getByRole('button', { name: 'Register' }).click();
  await registerResponsePromise;

  await expect(page.getByText('Registration successful! You can now log in.')).toBeVisible();

  expect(capturedPayload).toEqual({
    username: credentials.username,
    password: credentials.password,
  });
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

  await expect(page).toHaveURL('/');
});

test('guest is redirected from protected pages', async ({ page }) => {
  await page.goto('/inventory');
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});