import { test as setup } from '@playwright/test';
import { userSeeds } from '@/db/seed/user.seed';
import { HOME_URL, SIGNIN_URL } from '@/app.config';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // In a sandbox the preview is served through epic-proxy, which gates the
  // public URL on an ownership token. Without it every request is a 403 that
  // renders as an "Access Denied" page — indistinguishable, to a browser
  // driver, from an app that has not booted.
  //
  // Hitting the URL once with the token makes the proxy set its
  // `epic_proxy_auth` cookie and redirect to the clean path. From then on the
  // whole context carries it, and because this runs before `storageState` is
  // written, every dependent project inherits it too.
  //
  // Unset outside a sandbox (local runs reach the dev server directly), so
  // this is a no-op there.
  const proxyToken = process.env.EPIC_PROXY_TOKEN;
  if (proxyToken) {
    await page.goto(`/?_proxy_token=${encodeURIComponent(proxyToken)}`);
  }

  // Perform authentication steps
  await page.goto(SIGNIN_URL);
  await page.fill('input[name="email"]', userSeeds[0].email);
  await page.fill('input[name="password"]', userSeeds[0].password);
  await page.click('button[type="submit"]');

  // Wait for successful login with robust error handling
  try {
    await page.waitForURL(HOME_URL, { timeout: 10000 }); // 10 second timeout
  } catch {
    // Capture error messages
    const errorElement = await page.locator('[role="alert"]').textContent().catch(() => null);
    console.error('Login failed with error:', errorElement);
    console.error('Current URL:', page.url());

    // Screenshot for debugging
    await page.screenshot({ path: 'playwright/.auth/auth-setup-failed.png' });

    throw new Error(`Failed to login. Current URL: ${page.url()}`);
  }

  // Save signed-in state to 'playwright/.auth/user.json'
  await page.context().storageState({ path: authFile });
});