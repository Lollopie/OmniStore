import { expect, test, type Page } from '@playwright/test';
import { registerUser } from './api/api-helpers';

test.describe('Warehouse Flow', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: 'playwright/.auth/warehouse.json' });

  // Share a single page across serial tests
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // Create one context and page that persists state between test blocks
    const context = await browser.newContext({
      storageState: 'playwright/.auth/warehouse.json',
    });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('create warehouse', async () => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'No warehouses assigned.' })).toBeVisible();
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('heading', { name: 'Add Warehouse' })).toBeVisible();
    await page.getByLabel('Warehouse Name').fill('Test Warehouse');

    const createResponse = page.waitForResponse(
      (res) => res.url().includes('/warehouses') && res.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Add', exact: true }).filter({ hasText: 'Add' }).click();
    await createResponse;

    await expect(page.getByText('Warehouse "Test Warehouse" added successfully!')).toBeVisible();
    await expect(page.getByText('Add user', { exact: true })).toBeVisible();
  });

  test('search user', async () => {
    // Because we use the shared 'page' instance, localStorage values remain intact!
    await page.goto('/');

    // Correct way to read localStorage inside Playwright
    const username = await page.evaluate(() => localStorage.getItem('username'));

    await expect(page.getByPlaceholder('Search...')).toBeVisible();
    if (username) {
      await expect(page.getByText(username)).toBeVisible();
    }

    const searchResponse = page.waitForResponse(
      (res) => res.url().includes('/warehouses/users') && res.request().method() === 'GET'
    );

    await page.getByPlaceholder('Search...').fill('test');
    await searchResponse;
    await expect(page.getByText('No users in warehouse.')).toBeVisible();

    await page.getByPlaceholder('Search...').fill('user');
    await searchResponse;
    if (username) {
      await expect(page.getByText(username)).toBeVisible();
    }
  });
  test.describe('Add user to warehouse', () => {
    let targetUser: string;

    test.beforeEach(async ({ request }) => {
      targetUser = await registerUser(request);
    });

    // test.afterEach(async ({ request }) => {
    //   if (targetUser?.id) {
    //     await deleteUserViaApi(request, targetUser.id);
    //   }
    // });

    test('adds a secondary user to the warehouse', async () => {
      await page.goto('/');

      await page.getByPlaceholder('Username to add').fill(targetUser);
      await page.getByText('Add user', { exact: true }).click();
      const addResponse = page.waitForResponse(
        (res) => res.url().includes('/warehouses/users') && res.request().method() === 'POST'
      );
      await addResponse;
      await expect(
        page.getByText(`Added user "${targetUser}" to active warehouse`)
      ).toBeVisible();
      const userTableRow = page.getByRole('row').filter({ hasText: targetUser });
      await expect(userTableRow).toBeVisible();
    });
  });
});
