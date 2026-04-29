import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows hero heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2 })).toContainText('Burpees');
  });

  test('shows start CTA button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /start 60-day free access/i }),
    ).toBeVisible();
  });

  test('start CTA navigates to login', async ({ page }) => {
    await page.getByRole('button', { name: /start 60-day free access/i }).click();
    await expect(page).toHaveURL('/login');
  });

  test('pricing button navigates to pricing page', async ({ page }) => {
    await page.getByRole('button', { name: /see advanced pricing/i }).click();
    await expect(page).toHaveURL('/pricing');
  });

  test('sign in link navigates to login', async ({ page }) => {
    await page.getByRole('button', { name: /already a member/i }).click();
    await expect(page).toHaveURL('/login');
  });
});
