import { test, expect } from '@playwright/test';

test.describe('Pricing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('shows page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /workout tracks/i })).toBeVisible();
  });

  test('shows 60-day free access subtitle', async ({ page }) => {
    await expect(
      page.getByText('All users get 60-day launch free access from their start date.'),
    ).toBeVisible();
  });

  test('shows beginner card with free price', async ({ page }) => {
    await expect(page.getByText('BEGINNER', { exact: true })).toBeVisible();
    await expect(page.getByText('Free', { exact: true })).toBeVisible();
  });

  test('shows advanced card with monthly price', async ({ page }) => {
    await expect(page.getByText('ADVANCED', { exact: true })).toBeVisible();
    await expect(page.getByText('$4.99', { exact: true })).toBeVisible();
    await expect(page.getByText('/ month', { exact: true })).toBeVisible();
  });

  test('unauthenticated user sees sign-in prompt for advanced', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /sign in to unlock advanced/i }),
    ).toBeVisible();
  });

  test('back to app button returns to home', async ({ page }) => {
    await page.getByRole('button', { name: /back to app/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('shows trust badges', async ({ page }) => {
    await expect(page.getByText(/secure payments via stripe/i)).toBeVisible();
    await expect(page.getByText(/cancel anytime/i)).toBeVisible();
  });
});
