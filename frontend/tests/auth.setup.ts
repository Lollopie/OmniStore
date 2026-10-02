import { test as setup, expect } from '@playwright/test';
import { loginViaApi, seedAccount } from './utils/seed';

const authPath = 'playwright/.auth/';
// Accounts are seeded with an active subscription, so the warehouse and
// inventory tests can write without going through Stripe
setup('create warehouse account', async ({ page }) => {
  await page.goto('/');
  const account = seedAccount();
  await loginViaApi(page, account);
  await page.context().storageState({ path: authPath + 'warehouse.json' });
});
setup('create inventory account', async ({ page }) => {
  await page.goto('/');
  const account = seedAccount();
  await loginViaApi(page, account);
  const warehouseUrl = `${process.env.VITE_NESTJS_HOST_URL}/warehouses`;
  const warehouseAddSuccess = await page.evaluate(async (warehouseUrl) => {
    const res = await fetch(warehouseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        warehouseName: 'warehouse',
      }),
    });
    const json = await res.json();
    const activeWarehouse = json['warehouseId'];
    const activeRole = json['role'];
    localStorage.setItem('activeWarehouse', activeWarehouse);
    localStorage.setItem('activeRole', activeRole);
    localStorage.setItem('userWarehouses', JSON.stringify([json]));
    return res.ok;
  }, warehouseUrl);
  expect(warehouseAddSuccess).toBeTruthy();
  await page.context().storageState({ path: authPath + 'inventory.json' });
});
