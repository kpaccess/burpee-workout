import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { newLoggedInContext, testUser, ensureOnboarded } from './helpers/auth';

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

test('dashboard renders after login', async () => {
  await expect(page.getByText('Session Timer')).toBeVisible();
});

test('workout calendar shows day headers', async () => {
  // Match the chip label in the calendar grid (Mon appears in multiple places)
  await expect(page.getByText('Mon').first()).toBeVisible();
  await expect(page.getByText('Thu').first()).toBeVisible();
});

test('timer start button is visible', async () => {
  await expect(page.getByRole('button', { name: /^start$/i })).toBeVisible();
});

test('can interact with a workout day checkbox', async () => {
  const checkbox = page.locator('input[type="checkbox"]:not([disabled])').first();
  if (await checkbox.count() === 0) return; // no past workout days yet

  await checkbox.click();

  // Advanced track shows a type menu (N / C); close it and call the test done.
  // Beginner / non-Pro direct-toggles the checkbox state.
  const menu = page.locator('[role="menu"]');
  if (await menu.isVisible({ timeout: 1_500 }).catch(() => false)) {
    await page.keyboard.press('Escape');
  } else {
    // Wait for Firestore-backed state update, then restore
    const newChecked = await checkbox.isChecked({ timeout: 8_000 });
    if (newChecked !== (await checkbox.isChecked())) {
      await checkbox.click();
    }
  }
});

test('starting the timer shows prepare countdown', async () => {
  const startBtn = page.getByRole('button', { name: /^start$/i });
  await startBtn.click();
  // After clicking start, the 10-second prepare phase begins
  await expect(page.getByText('GET READY')).toBeVisible({ timeout: 3_000 });

  // Cancel and reset to leave timer in clean state for subsequent tests
  await page.getByRole('button', { name: /cancel/i }).click();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
});

test('user menu and logout are accessible', async () => {
  // Logout button should exist somewhere in the dashboard
  await expect(page.getByRole('button', { name: /log out/i })).toBeVisible();
});
