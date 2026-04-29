import { Page, Browser, BrowserContext } from '@playwright/test';

export const testUser = {
  email: process.env.TEST_USER_EMAIL!,
  password: process.env.TEST_USER_PASSWORD!,
};

export const adminUser = {
  email: process.env.TEST_ADMIN_EMAIL!,
  password: process.env.TEST_ADMIN_PASSWORD!,
};

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByRole('heading', { name: 'Welcome Back' }).waitFor();
  await page.locator('[aria-label="Email"] input').fill(email);
  await page.locator('[aria-label="Password"] input').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('/', { timeout: 15_000 });
  // Wait for auth + Firestore loading to settle (spinner disappears)
  await page.locator('[role="progressbar"]').waitFor({ state: 'hidden', timeout: 15_000 });
}

/**
 * If the test user hasn't completed onboarding yet, fill in the minimum
 * required fields and submit so the Dashboard becomes accessible.
 * Safe to call even if already onboarded (no-op in that case).
 */
export async function ensureOnboarded(page: Page, tier: 'beginner' | 'advanced' = 'advanced') {
  // Already on dashboard
  if (await page.getByText('Session Timer').isVisible()) return;

  // Select tier by clicking its card
  const tierLabel = tier === 'beginner' ? 'Beginner' : 'Advanced';
  await page.getByText(tierLabel, { exact: true }).first().click();

  // Fill start date (today) and weight
  const today = new Date().toISOString().slice(0, 10);
  await page.getByLabel('Start Date').fill(today);
  await page.getByLabel('Weight (lbs/kg)').fill('150');

  // Submit (level already defaults after tier selection)
  await page.getByRole('button', { name: new RegExp(`start ${tier} program`, 'i') }).click();

  // Wait for dashboard to load
  await page.getByText('Session Timer').waitFor({ timeout: 15_000 });
}

export async function newLoggedInContext(
  browser: Browser,
  user: { email: string; password: string },
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await loginAs(page, user.email, user.password);
  return { context, page };
}
