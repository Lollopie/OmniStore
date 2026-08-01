import { test as setup, expect } from '@playwright/test';

const authPath = 'playwright/.auth/';
setup('create warehouse account', async ({ request, page }) => {
  await page.goto('/');
  const credentials = {
    username: `user_${Date.now()}`,
    password: 'password123',
  };
  const response = await request.post(`${process.env.VITE_NESTJS_HOST_URL}/register`, {
    data: {
      username: credentials.username,
      password: credentials.password,
    }
  });
  expect(response.status()).toBe(201);
  const url = `${process.env.VITE_NESTJS_HOST_URL}/login`;
  const loginSuccess = await page.evaluate(async ({url, credentials}) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
    });
    return res.ok;
  }, {url, credentials});
  expect(loginSuccess).toBeTruthy();
  await page.context().storageState({ path: authPath + 'warehouse.json' });
});
setup('create inventory account', async ({ request, page }) => {
  await page.goto('/');
  const credentials = {
    username: `user_${Date.now()}`,
    password: 'password123',
  };
  const response = await request.post(`${process.env.VITE_NESTJS_HOST_URL}/register`, {
    data: {
      username: credentials.username,
      password: credentials.password,
    }
  });
  expect(response.status()).toBe(201);
  const url = `${process.env.VITE_NESTJS_HOST_URL}/login`;
  const loginSuccess = await page.evaluate(async ({url, credentials}) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
    });
    return res.ok;
  }, {url, credentials});
  expect(loginSuccess).toBeTruthy();
  const warehouseUrl = `${process.env.VITE_NESTJS_HOST_URL}/warehouse`;
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
    localStorage.setItem('activeWarehouse', JSON.stringify(activeWarehouse));
    localStorage.setItem('activeRole', JSON.stringify(activeRole));
    localStorage.setItem('userWarehouses', JSON.stringify([json]));
    return res.ok;
  }, warehouseUrl);
  expect(warehouseAddSuccess).toBeTruthy();
  await page.context().storageState({ path: authPath + 'inventory.json' });
});