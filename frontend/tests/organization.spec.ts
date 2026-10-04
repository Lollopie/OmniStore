import { expect, Page, test } from '@playwright/test';
import { seedAccount } from './utils/seed';

async function loginAsOwner(page: Page) {
  const account = seedAccount();
  await page.goto('/login');
  await page.getByLabel('Username').fill(account.username);
  await page.getByRole('textbox', { name: 'Password' }).fill(account.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL('/organizations');
  return account;
}

test.describe('Organization invites', () => {
  test('owner can invite a user to the organization and revoke the invite', async ({ page }) => {
    await loginAsOwner(page);
    await page.getByRole('link', { name: 'Invites' }).click();
    await expect(page).toHaveURL('/organizations/invites');
    await expect(page.getByText('No pending invites.')).toBeVisible();

    const email = `invitee_${Date.now()}@example.org`;
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Organization role').selectOption('admin');
    const inviteResponse = page.waitForResponse(
      (res) => res.url().endsWith('/organizations/invites') && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Invite', exact: true }).click();
    expect((await inviteResponse).status()).toBe(201);
    await expect(page.getByText('Invite sent successfully')).toBeVisible();

    const row = page.getByRole('row', { name: new RegExp(email) });
    await expect(row).toContainText('admin (organization)');

    await row.getByRole('button', { name: 'Revoke' }).click();
    await expect(page.getByText('Invite revoked')).toBeVisible();
    await expect(page.getByText('No pending invites.')).toBeVisible();
  });

  test('owner can choose every role, including owner', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/organizations/invites');
    await expect(page.getByLabel('Organization role').locator('option')).toHaveText(['owner', 'admin', 'member']);
  });
});

test.describe('Organization members', () => {
  test('the only owner cannot remove themselves', async ({ page }) => {
    const account = await loginAsOwner(page);
    const row = page.getByRole('row', { name: new RegExp(account.username) });
    await expect(row.getByLabel(`Role of ${account.username}`).locator('option')).toHaveText(['owner', 'admin', 'member']);

    await row.getByRole('button', { name: `Remove ${account.username}` }).click();
    await expect(page.getByText('Leave the organization?')).toBeVisible();
    const removeResponse = page.waitForResponse(
      (res) => res.url().includes('/organizations/users/') && res.request().method() === 'DELETE',
    );
    await page.getByRole('button', { name: 'Confirm removal' }).click();
    expect((await removeResponse).status()).toBe(400);
    await expect(page.getByText('An organization must have at least one owner')).toBeVisible();
    await expect(page).toHaveURL('/organizations');
  });
});

test.describe('Organization settings', () => {
  test('owner can rename the organization', async ({ page }) => {
    const account = await loginAsOwner(page);
    await page.locator('a[href="/organizations/settings"]').click();
    const nameInput = page.getByLabel('Organization Name');
    await expect(nameInput).toHaveValue(account.orgName);

    const newName = `${account.orgName}_renamed`;
    await nameInput.fill(newName);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Organization renamed')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Organization Name')).toHaveValue(newName);
  });

  test('owner can delete the organization after typing its name', async ({ page }) => {
    const account = await loginAsOwner(page);
    await page.goto('/organizations/settings');
    await page.getByRole('button', { name: 'Delete Organization' }).click();

    const confirmButton = page.getByRole('button', { name: 'Confirm organization deletion' });
    await page.getByPlaceholder('Organization name').fill('wrong name');
    await expect(confirmButton).toBeDisabled();

    await page.getByPlaceholder('Organization name').fill(account.orgName);
    const deleteResponse = page.waitForResponse(
      (res) => res.url().endsWith('/organizations') && res.request().method() === 'DELETE',
    );
    await confirmButton.click();
    expect((await deleteResponse).status()).toBe(200);
    await expect(page).toHaveURL('/login');

    // The owner's account was deleted with the organization
    await page.getByLabel('Username').fill(account.username);
    await page.getByRole('textbox', { name: 'Password' }).fill(account.password);
    const loginResponse = page.waitForResponse(
      (res) => res.url().endsWith('/login') && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Login' }).click();
    expect((await loginResponse).ok()).toBe(false);
  });
});

test.describe('Organization billing', () => {
  test('shows plans that are not billed through Stripe', async ({ page }) => {
    await loginAsOwner(page);
    await page.locator('a[href="/organizations/billing"]').click();
    await expect(page.getByRole('heading', { name: 'Starter plan' })).toBeVisible();
    await expect(page.getByText('This plan is not billed through Stripe.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Manage billing' })).toBeHidden();
  });

  test('owner can open the Stripe Customer Portal', async ({ page }) => {
    await loginAsOwner(page);
    const api = process.env.VITE_NESTJS_HOST_URL!;
    const portalUrl = 'https://billing.stripe.com/p/session/test_portal';
    const cors = {
      'Access-Control-Allow-Origin': 'http://localhost:5173',
      'Access-Control-Allow-Credentials': 'true',
    };
    // Only the billing calls are mocked, everything else hits the real backend
    await page.route(`${api}/organizations/billing`, (route) =>
      route.fulfill({
        headers: cors,
        contentType: 'application/json',
        body: JSON.stringify({
          plan: 'growth',
          manageable: true,
          status: 'active',
          currentPeriodEnd: '2026-11-01T00:00:00.000Z',
          cancelAt: null,
        }),
      }),
    );
    await page.route(`${api}/organizations/billing/portal`, (route) =>
      route.request().method() === 'OPTIONS'
        ? route.fulfill({ status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'POST' } })
        : route.fulfill({ status: 201, headers: cors, contentType: 'application/json', body: JSON.stringify({ url: portalUrl }) }),
    );
    await page.route(portalUrl, (route) => route.fulfill({ contentType: 'text/html', body: '<h1>Stripe portal</h1>' }));

    await page.goto('/organizations/billing');
    await expect(page.getByRole('heading', { name: 'Growth plan' })).toBeVisible();
    await expect(page.getByText(`Renews on ${new Date('2026-11-01T00:00:00.000Z').toLocaleDateString('en-US')}`)).toBeVisible();
    await page.getByRole('button', { name: 'Manage billing' }).click();
    await expect(page).toHaveURL(portalUrl);
  });
});
