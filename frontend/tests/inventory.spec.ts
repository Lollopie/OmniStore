import { expect, test, type Page } from '@playwright/test';

test.describe('Inventory Flow', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: 'playwright/.auth/inventory.json' });
  let page: Page;
  let testItem: { name: string; amount: string };
  let editedItem: { name: string; amount: string };
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/inventory.json',
    });
    testItem = {
      name: 'Test Item',
      amount: '100',
    }
    editedItem = {
      name: 'Edited Item',
      amount: '5',
    }
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('add item to inventory', async () => {
    await page.goto('/inventory');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('heading', { name: 'Add Item' })).toBeVisible();
    await page.getByLabel('Item Name').fill(testItem.name);
    await page.getByLabel('Amount').fill(testItem.amount);
    const createResponse = page.waitForResponse(
      (res) => res.url().includes('/inventory') && res.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Add', exact: true }).filter({ hasText: 'Add' }).click();
    await createResponse;

    await expect(page.getByText('Item added successfully!')).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: testItem.name })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: testItem.amount })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' }).filter({ hasNotText: 'Cancel' })).toBeVisible();
  });

  test('search item', async () => {
    await expect(page.getByPlaceholder('Search...')).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: testItem.name })).toBeVisible();

    const searchResponse = page.waitForResponse(
      (res) => res.url().includes('/inventory') && res.request().method() === 'GET'
    );

    await page.getByPlaceholder('Search...').fill('user');
    await searchResponse;
    await expect(page.getByText('No items in inventory.')).toBeVisible();

    await page.getByPlaceholder('Search...').fill(testItem.name);
    await searchResponse;
    if (testItem.name) {
      await expect(page.getByText(testItem.name)).toBeVisible();
    }
    await page.getByPlaceholder('Search...').fill('');
  });
  test('edit item', async () => {
    await expect(page.getByRole('row').filter({ hasText: testItem.name })).toBeVisible();
    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Update Item' })).toBeVisible();
    await page.getByLabel('Item Name').fill(editedItem.name);
    await page.getByLabel('Amount').fill(editedItem.amount);
    const updateResponse = page.waitForResponse(
      (res) => res.url().includes('/inventory') && res.request().method() === 'PATCH'
    );
    await page.getByRole('button', { name: 'Add' }).filter({ hasText: 'Update' }).click();
    await updateResponse;

    await expect(page.getByText('Item updated successfully!')).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: editedItem.name })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: editedItem.amount })).toBeVisible();
  });
  test('delete item', async () => {
    const tableRow = page.getByRole('row').filter({ hasText: editedItem.name });
    await expect(tableRow).toBeVisible();
    const deleteResponse = page.waitForResponse(
      (res) => res.url().includes('/inventory') && res.request().method() === 'DELETE'
    );
    await tableRow.getByRole('button', { name: 'Delete' }).filter({ hasNotText: 'Cancel' }).click();
    await deleteResponse;

    await expect(page.getByText('Item deleted successfully!')).toBeVisible();
    await expect(page.getByText('No items in inventory.')).toBeVisible();
  });
});
