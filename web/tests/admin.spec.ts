import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { newLoggedInContext, testUser, adminUser, ensureOnboarded } from './helpers/auth';

// ── Non-admin: redirected away from /admin ──────────────────────────────────

test.describe('Admin page — non-admin user', () => {
  test.describe.configure({ mode: 'serial' });

  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    ({ context, page } = await newLoggedInContext(browser, testUser));
    await ensureOnboarded(page);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('non-admin is redirected away from /admin', async () => {
    await page.goto('/admin');
    await page.waitForTimeout(2_000); // allow redirect to complete
    await expect(page).not.toHaveURL('/admin');
  });
});

// ── Admin user: full access ─────────────────────────────────────────────────

test.describe('Admin page — admin user', () => {
  test.describe.configure({ mode: 'serial' });

  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    ({ context, page } = await newLoggedInContext(browser, adminUser));
    await ensureOnboarded(page); // ensures Firebase auth is fully settled
    await page.goto('/admin');
    await page.getByRole('heading', { name: /admin dashboard/i }).waitFor({ timeout: 10_000 });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('shows admin dashboard heading', async () => {
    await expect(page.getByRole('heading', { name: /admin dashboard/i })).toBeVisible();
  });

  test('shows total visitors and sign-ups stat cards', async () => {
    await expect(page.getByText('Total Visitors')).toBeVisible();
    await expect(page.getByText('Total Sign-ups')).toBeVisible();
  });

  test('shows daily visits table', async () => {
    await expect(page.getByText('Visits by Day')).toBeVisible();
  });

  test('users table has expected column headers', async () => {
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Level' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Day' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Workouts' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Timer Verified' })).toBeVisible();
  });

  test('users table has at least one row', async () => {
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });
});
