import { expect, test, type Page, type Route } from '@playwright/test';

/**
 * UI-only tests for the subscription flow. Every backend endpoint is mocked,
 * so no request reaches the real backend or Stripe.
 */
const API = process.env.VITE_NESTJS_HOST_URL!;
const APP_ORIGIN = 'http://localhost:5173';
const STRIPE_CHECKOUT_URL = 'https://checkout.stripe.com/c/pay/cs_test_123';

const corsHeaders = {
  'Access-Control-Allow-Origin': APP_ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

type Handler = (route: Route) => Promise<void>;
type Subscription = 'starter' | 'growth' | 'enterprise' | null;

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify(body) });
}

/** Mocks the backend; keys are "METHOD /path". Unmocked calls get a 404. */
async function mockApi(page: Page, handlers: Record<string, Handler>) {
  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: corsHeaders });
    }
    const { pathname } = new URL(request.url());
    const handler = handlers[`${request.method()} ${pathname}`] ?? handlers[`${request.method()} ${pathname}/`];
    if (handler) {
      return handler(route);
    }
    return json(route, { message: `Not mocked: ${request.method()} ${pathname}` }, 404);
  });
}

/** Mocks a logged-in session whose subscription endpoint is answered by `getSubscription`. */
async function mockLoggedIn(
  page: Page,
  getSubscription: (sessionId: string | null) => Subscription,
  extraHandlers: Record<string, Handler> = {},
) {
  const subscriptionRequests: (string | null)[] = [];
  await mockApi(page, {
    'GET /auth/status': (route) => json(route, { message: 'User is authenticated' }),
    'GET /organizations/subscription': (route) => {
      const sessionId = new URL(route.request().url()).searchParams.get('sessionId');
      subscriptionRequests.push(sessionId);
      return json(route, { subscription: getSubscription(sessionId) });
    },
    ...extraHandlers,
  });
  return subscriptionRequests;
}

async function mockInventory(page: Page) {
  // Shows the add/edit/delete controls, which are only rendered for warehouse admins
  await page.addInitScript(() => localStorage.setItem('activeRole', 'admin'));
  return {
    'GET /inventory': (route: Route) => json(route, [[{ itemId: 'item-1', itemName: 'Widget', amount: '5' }], 1]),
  };
}

const readOnlyBanner = (page: Page) => page.getByText('Your organization has no active subscription.');

test.describe('Subscribe page', () => {
  test('shows all plans and redirects to Stripe Checkout for the chosen plan', async ({ page }) => {
    let checkoutPayload: unknown;
    await mockLoggedIn(page, () => null, {
      'POST /checkout/create-session': (route) => {
        checkoutPayload = route.request().postDataJSON();
        return json(route, { url: STRIPE_CHECKOUT_URL, sessionId: 'cs_test_123' }, 201);
      },
    });
    await page.route('https://checkout.stripe.com/**', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<h1>Stripe Checkout</h1>' }),
    );

    await page.goto('/subscribe');
    await expect(page.getByRole('heading', { name: 'Choose your subscription' })).toBeVisible();
    for (const plan of ['Starter', 'Growth', 'Enterprise']) {
      await expect(page.getByRole('button', { name: `Choose ${plan}` })).toBeVisible();
    }
    // The page itself explains the plan choice, so the banner is hidden here
    await expect(readOnlyBanner(page)).toBeHidden();

    await page.getByRole('button', { name: 'Choose Growth' }).click();

    await expect(page).toHaveURL(STRIPE_CHECKOUT_URL);
    expect(checkoutPayload).toEqual({ plan: 'growth' });
  });

  test('shows an error and re-enables the plans when checkout cannot be started', async ({ page }) => {
    await mockLoggedIn(page, () => null, {
      'POST /checkout/create-session': (route) => json(route, { message: 'Unknown subscription plan' }, 400),
    });

    await page.goto('/subscribe');
    await page.getByRole('button', { name: 'Choose Starter' }).click();

    await expect(page.getByText('Could not start checkout. Please try again.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Choose Starter' })).toBeEnabled();
    await expect(page).toHaveURL('/subscribe');
  });

  test('a cancelled checkout returning to the page does not try to confirm the session', async ({ page }) => {
    // Simulates the pending marker left behind by a checkout the user then cancelled
    await page.addInitScript(() =>
      sessionStorage.setItem('checkoutPending', JSON.stringify({ sessionId: 'cs_test_cancelled', at: Date.now() })),
    );
    const subscriptionRequests = await mockLoggedIn(page, () => null);

    await page.goto('/subscribe');

    await expect(page.getByRole('heading', { name: 'Choose your subscription' })).toBeVisible();
    await expect.poll(() => subscriptionRequests.length).toBeGreaterThan(0);
    expect(subscriptionRequests).not.toContain('cs_test_cancelled');
  });
});

test.describe('Read-only mode', () => {
  test('disables write controls and links to the plans without an active subscription', async ({ page }) => {
    await mockLoggedIn(page, () => null, await mockInventory(page));

    await page.goto('/inventory');

    await expect(readOnlyBanner(page)).toBeVisible();
    await expect(page.getByText('Widget')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Edit' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeDisabled();

    await page.getByRole('link', { name: 'Choose a plan' }).click();
    await expect(page).toHaveURL('/subscribe');
  });

  test('enables write controls with an active subscription', async ({ page }) => {
    const subscriptionRequests = await mockLoggedIn(page, () => 'starter', await mockInventory(page));

    await page.goto('/inventory');

    await expect(page.getByText('Widget')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Edit' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeEnabled();
    await expect(readOnlyBanner(page)).toBeHidden();
    // Without a pending checkout the provider must not send a session ID
    expect(subscriptionRequests.every((sessionId) => sessionId === null)).toBe(true);
  });
});

test.describe('Subscription request failures', () => {
  test('do not put the app into read-only mode', async ({ page }) => {
    let requests = 0;
    await mockApi(page, {
      'GET /auth/status': (route) => json(route, { message: 'User is authenticated' }),
      'GET /organizations/subscription': (route) => {
        requests++;
        return json(route, { message: 'ThrottlerException: Too Many Requests' }, 429);
      },
      ...(await mockInventory(page)),
    });

    await page.goto('/inventory');

    // Retried before giving up; an unknown status must not lock the UI
    await expect.poll(() => requests, { timeout: 10_000 }).toBeGreaterThanOrEqual(3);
    await expect(page.getByText('Widget')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).toBeEnabled();
    await expect(readOnlyBanner(page)).toBeHidden();
  });
});

test.describe('Checkout success page', () => {
  test('confirms the session from the URL and redirects to the app', async ({ page }) => {
    // The initial requests find the subscription not yet active; the provider's
    // retry ~2s later succeeds. Time-based because StrictMode doubles the first request.
    let activeAfter: number | undefined;
    const subscriptionRequests = await mockLoggedIn(page, (sessionId) => {
      if (sessionId !== 'cs_test_123') {
        return null;
      }
      activeAfter ??= Date.now() + 1000;
      return Date.now() >= activeAfter ? 'starter' : null;
    });

    await page.goto('/checkout/success?session_id=cs_test_123');

    await expect(page.getByText('Processing your purchase...')).toBeVisible();
    await expect(page).toHaveURL('/organizations');
    expect(subscriptionRequests).toContain('cs_test_123');
    await expect(readOnlyBanner(page)).toBeHidden();
  });

  test('shows a fallback when the purchase cannot be confirmed and lets the user check again', async ({ page }) => {
    let subscription: Subscription = null;
    const subscriptionRequests = await mockLoggedIn(page, () => subscription);
    // Fake timers, so the ~30s of retries can be skipped
    await page.clock.install();

    await page.goto('/checkout/success?session_id=cs_test_123');
    await expect(page.getByText('Processing your purchase...')).toBeVisible();

    const fallbackHeading = page.getByRole('heading', { name: 'This is taking longer than usual' });
    await expect(async () => {
      await page.clock.runFor(2000);
      await expect(fallbackHeading).toBeVisible({ timeout: 250 });
    }).toPass({ timeout: 30_000 });

    await expect(page.getByText('Your payment went through, and access will be enabled shortly.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', '/contact');
    // Read-only, but the banner would duplicate the fallback message
    await expect(readOnlyBanner(page)).toBeHidden();

    subscription = 'starter';
    const requestsBeforeRetry = subscriptionRequests.length;
    await page.getByRole('button', { name: 'Check again' }).click();

    await expect(page).toHaveURL('/organizations');
    // The retry still confirms the same checkout session
    expect(subscriptionRequests.slice(requestsBeforeRetry)).toContain('cs_test_123');
  });
});
