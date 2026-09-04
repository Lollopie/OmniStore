import { Page } from '@playwright/test';

const MAILPIT_URL = 'http://localhost:8025';

export async function getLatestEmailFor(page: Page, toAddress: string, retries = 10) {
  for (let i = 0; i < retries; i++) {
    const res = await page.request.get(
      `${MAILPIT_URL}/api/v1/search?query=to:${toAddress}`
    );
    const data = await res.json();
    if (data.messages?.length > 0) {
      const messageId = data.messages[0].ID;
      const full = await page.request.get(
        `${MAILPIT_URL}/api/v1/message/${messageId}`
      );
      return full.json();
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No email found for ${toAddress} after ${retries} retries`);
}