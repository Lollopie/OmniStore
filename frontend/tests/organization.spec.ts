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
